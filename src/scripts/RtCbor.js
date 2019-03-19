/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */ //for jslint
/*globals */ //for jslint

/**Utility to provide conversion between CBOR data, to be sent or received, and Javascript objects
 * Collections can be unbounded Arrays or Omaps (which are arrays with an attributes object at the first location)
 * Fixed cbor arrays are not supported
 * Primitives are Strings, boolean, NULL
 */

/**module definition*/
var rtCbor = (function() {
    "use strict"; //enable javascript strict mode
    
    //Dependencies:
    //-----------------------
    
    
    //Closure local variables:
    //------------------------
    var
      buffers = [],    //array of type js Buffer. Holds the CBOR bytes
      whichBuffer=0,   //index into which buffer is currenly being used
      curpos=0,        //cursor into buffers[whichBuffer]
      tempBytes = []   //temp js array used to assemble Buffer entries
      ;
    
    // -----------
    // Functions:
    // ------------
    
    /**Append a new Buffer with CBOR bytes. Can be array of Buffers as well*/
    var addCborBuffer = function(aBuffer) {
      let argCnt = arguments.length;
      switch(argCnt) {
        case 0:  //no entries
          break;  
        case 1:  //single Buffer entry
          buffers.push(aBuffer);
          break;
        default: //multiple Buffer entries
          for(let i=0; i<arguments.length; i++) {
            buffers.push(arguments[i]);
          }
          break;
      }
    };
  
    /**Low level append a byte to this buffer*/
    var appendTemp = function(b) {
      tempBytes.push(b);
    };

   /**Low level append an array of bytes to this buffer*/
  var appendByteArray = function(bytes) {
    for(var i=0; i<bytes.length; i++)
      tempBytes.push(bytes[i]);
  };
  
    /**Returns true at the array end marker (0xff)*/
    var atArrayEnd = function () {
      return peekByte() === 0xff;
    };
  
    /**Clears out the all internal buffers*/
    var clear = function() {
      buffers=[];
      whichBuffer=0;
      curpos=0;
      clearTemp();
    };
    
    /**Clears out internal temporary buffer used to build up commands*/
    var clearTemp = function() {
      tempBytes = [];
    };
    
    /**Adds a string array*/
    var encodeArray = function(val) {
      appendTemp(0x9f); //starts an unbounded array
      for(let i = 0; i < val.length; i++) {
        encodeString(val[i]);
      }
      appendTemp(0xff); //end byte for an unbounded collection
      pushTemp(); //put away the temp buffer
    };
  
  
    /**Apppends a null entry*/
    var encodeNull = function() {
      appendTemp(0xf6); //append a NULL entry
    };
  
    /**Appends a named map.
     * Note: if name is null then is an unnamed map
     * If map is null then this simply emits a null*/
    var encodeOMap = function(name, map) {
      if(map === null) {
        encodeNull();
      }
      else {
        startOmap(name);
        for(var key in map) {
          if(map.hasOwnProperty(key)) {
            encodeString(key);      //save the key
            encodeString(map[key]); //save the value
          }
        }
        appendTemp(0xff); //end byte for an unbounded collection
        pushTemp(); //put away the temp buffer
      }
    };
   
    /**Appends a string*/
    var encodeString = function(value) {
      if(value === null) {
        encodeNull();
      }
      else {
        let size = value.length; //int
        writeCborSize(0x60, size);
        appendByteArray(stringToBytes(value));
      }
    };
  
    /**Returns a Buffer containing the CBOR representing all of the previous encode() calls.
     * Clears the buffer for subsequent operations*/
    var getCborAsBuffer = function() {
      pushTemp(); //do a final temp buffer save in case there are some bytes remaining
      let ret = Buffer.concat(buffers); //concatentate all the internal buffers to one
      clear(); //clear the internal buffers
      return ret;
    };
  
    /**Called when the next item is a byte array. Returns values in a js array[]*/
    var getByteArray = function() {
      let size = nextCborSize();
      return nextBytes(size);
    };
  
    /**Returns the next item: string array, boolean, byte array, omap, string, or null*/
    var getNext = function() {
      if(peekByte()===null) return null; //nothing left to get
  
      let theType = getType();
      switch(theType) {
        case "Array":        return getArray();
        case "BoolTrue":     return true;
        case "BoolFalse":    return false;
        case "Bytes":        return getByteArray();
        //case "Float":      return getDouble();
        //case "FloatArray": return getDoubleArray();
        //case "Integer":    return getLong();
        case "Omap":         return getOmap();
        case "String":       return getString();
        case "Null":         return null;
        default:
          console.error('rtCbor Error. Unrecognized type: ' + theType);
          nextByte(); //ISSUE: how to know how many bytes to skip when don't know what it is?
          return null; //TODO: throw an exception instead?
      }
    };
    
    /**Called when the next item is an Array
     * Returns an array containing strings, arrays, omaps*/
    var getArray = function() {
      let rtn = [];
      while(!atArrayEnd()) {
        rtn.push(getNext());
      }
      nextByte(); //clear the array end
      return rtn;
    };
    
    /**Called when the next item is an omap
     * This version returns a js array where the first entry is an attributes map and subsequent entries are the alternating key/values successively.
     *    { Tagged: [ { value: <omapName> }, key1, val1, key2, val2, ... ] }
     * Each val can be a string, key/val list[], or another omap
     * /
    var getOmap = function() { //getOmap_OLD
      let val = [];
      let attribs = {
        value: getNext() //omap name (which is also the thing that used to be called the target widgetId)
      };
      val.push(attribs);
      while(!atArrayEnd()) {
        val.push(getNext());
      }
      nextByte(); //clear the array end
  
      let ret = { Tagged: val }; //wrapper the array
      return ret;
    };
    */
  
    /**Called when the next item is an omap
     * Returns an array with the omap name as .omapName
     * The entries are key/values stored successively at array locations
     * Each value can be a string, key/val list[], or another omap
     */
    var getOmap = function() { //getOmapAsNamedArray
      let ret = [];
      ret.omapName = getNext(); //omap name (which is also the thing that used to be called the target widgetId)
      while(!atArrayEnd()) {
        ret.push(getNext());
      }
      nextByte(); //clear the array end
      return ret;
    };
  
    /**Called when the next item is an omap
     * This version reurns as a map with the name accessible as .omapName
     * The entries are key/values of the map
     * Entries with multiple values for the same key show us as an array instead of a string
     * Each value can be a string, key/val list[], or another omap
     * /
    var getOmap = function() { //getOmapAsMap
      let ret = {};
      ret.omapName = getNext(); //omap name (which is also the thing that used to be called the target widgetId)
      while(!atArrayEnd()) {
        let key = getNext();
        let val = getNext();
        let entry = ret[key]; //see if there is already an entry
        if(entry) {           //if entry already exists
          if(entry.push) {    //see if is already an array
            entry.push(val);  //add it to the array
          }
          else {  //make an array and populate it with first entry and the new one
            let a = [];
            a.push(entry);
            a.push(val);
            ret[key] = a; //the array is now the value
          }
        }
        else { //first time entry for this key
          ret[key] = val;
        }
      }
      nextByte(); //clear the array end
      return ret;
    };
    */

      /**Converts byte[] of ASCII byte to a string*/
  var bytesToString = function(bytes) {
    let cnt = bytes.length;
    let rtn = ""; //String rtn = (new String(bytes, "ISO-8859-1"));
    for(let i=0; i<cnt; i++)
      rtn += String.fromCharCode(bytes[i]);
    return rtn;    
  };  
  
    /**Called when a String tag was seen (and cleared off)
     * Returns a string*/
    var getString = function() {
      let size = nextCborSize();
      return bytesToString(nextBytes(size));
    };
  
    /**Fetches the next 1 or 2 bytes and returns a string representing the type:
     * e.g. end, empty, Bytes, String, Integer, Omap, Array, Uri, Tag, Float, Null, Boolean*/
    var getType = function() {
      if(peekByte()===null) return "end";
      if(buffers.length===0) return "empty";
      let tag = nextByte(); //byte
      switch(tag & 0xe0) {
        case 0x40: return "Bytes";
        case 0x60: return "String";
        case 0x00: return "Integer";
        case 0x20: return "Integer";
        case 0xc0: {
          let tagValue = nextCborSize(); //long
          if(tagValue === 32) {  //look for URI
            skip(tag);           //skip the string
            return "Uri";
          }
          return "Tag";
        }
      }
      switch(tag) {
        case 0x9f:  //indefinite Array
          if(peekByte() === 0xd3) { //omap tag
            nextByte();
            return "Omap";
          }
          return "Array";
        case 0xfb: return "Float"; 
        case 0xf6: return "Null";  
        case 0xf5: return "BoolTrue";  // true
        case 0xf4: return "BoolFalse"; // false
      }
      return "unknown";
    };
  
    /**Computes the CBOR size of the next element
     * Advances the cursor
     * */
    var nextCborSize = function() {
      let tag = nextByte() & 0x1f;
      if(tag < 24) return tag;
      let cnt = 0;
      switch(tag) {
        case 24: cnt = 1; break;
        case 25: cnt = 2; break;
        case 26: cnt = 4; break;
        case 27: cnt = 8; break;
      }
      let tmp = 0;
      for(let i=0; i<cnt; i++) {
        tmp = tmp << 8;
        tmp = tmp | (nextByte() & 0xff);
      }
      return tmp;
    };
    
    /**Returns the requested number of bytes from the input buffers, as a js array[].
     * Advances the read curpos*/
    var nextBytes = function(len) {
      let rtn = [];
      for(let i=0; i<len; i++) {
        let b = nextByte();
        if(b)
          rtn.push(b);
        else break; //ran out of bytes early
      }
      return rtn;
    };
  
    /**Returns the next byte in the input Buffers. Increments the cursor*/
    var nextByte = function() {
      if(whichBuffer < buffers.length) {
        let buff = buffers[whichBuffer];
        if(curpos < buff.length) {
          return buff.readInt8(curpos++); //note: increment curpos
        }
        else { //next Buffer in the list
          whichBuffer++; //nextBuffer
          curpos=0;      //start at the the beginning
          return nextByte(); //recursive call to get first byte of next entry
        }
      }
      else return null; //no more data
    };
    
    /**Peeks the next byte in the input Buffers, does not increment the cursor*/
    var peekByte = function() {
      if(whichBuffer < buffers.length) { //get current buffer being read
        let buff = buffers[whichBuffer];
        if(curpos < buff.length) {
          return buff.readInt8(curpos); //note: no increment
        }
        else { //next Buffer in the list
          whichBuffer++; //nextBuffer
          curpos=0;      //start at the the beginning
          return peekByte(); //recursive call to get first byte of next entry
        }
      }
      else return null; //no more data (no more Buffers) available
    };
    
    /**Save off the temp byte buffer as an entry in buffers buffers array
     * Also clears the temp buffer*/
    var pushTemp = function() {
      if(tempBytes.length>0) { //only push it if it contains something useful
        addCborBuffer(Buffer.from(tempBytes));
        clearTemp();
      }
    };
  
    /**Skips an element.
     * Assumes the identifying tag was already read (so it must be passed in)
     * Sets cursor to next item*/
    var skip = function(tagByte) {
      var b, skipSize;
      if(tagByte === 0x9f) {
        b = peekByte();
        if(b===null) return null; //nothing left to get
        while(b!==null && b!==0xff) {
          b = nextByte();
        }
        nextByte(); //clear the array end byte 0xff
      }
      else {
        skipSize = 0;
        if(tagByte === 0xff) {
          nextByte();
          return;
        }
        if((tagByte & 0xe0) === 0x40) {
          skipSize = nextCborSize();
          for(let i=0; i<skipSize; i++) nextByte();
        }
        if((tagByte & 0xe0) === 0x60) {
          skipSize = nextCborSize();
          for(let i=0; i<skipSize; i++) nextByte(); //skip bytes
        }
        if((tagByte & 0xe0) === 0x00) nextCborSize();
        if((tagByte & 0xe0) === 0x20) nextCborSize();
        if(tagByte === 0xfb) {
          for(let i=0; i<9; i++) nextByte(); //skip float, 8 bytes+1
        }
        if((tagByte & 0xe0) === 0xc0) {
          let size = nextCborSize();
          if(size === 32) {  //look for URI
            skip(nextByte()); //skip the string
            return;
          }
        }
        
        //Note: byte was already read so nothing actually needs to happen here. Including it just for completeness:
        switch(tagByte) {
          case 0xf6: //null
          case 0xf5: //true
          case 0xf4: //false
        }
      }
    };
  
    /**Starts an unbounded ordered map of name
     * if name is null or empty string then is a nameless omap
     * which is equivalent to a map*/
    var startOmap = function(name) {
      appendTemp(0x9f);
      appendTemp(0xd3);  //omap tag
    if(name === null || name === '' || name === undefined ) {
        encodeNull();
      }
      else {
        encodeString(name); //omap name
      }
    };
    
    /**Converts string to byte array*/
    var stringToBytes = function(astring) {
      let rtn=[];
      for(let i=0; i<astring.length; i++) 
        rtn.push(astring.charCodeAt(i));
      return rtn;
    };
    
  
    /**Writes cbor size entry. Note: allows up to a 63 bit int (must be positive)
     * Given arguments of integer typeVal, integer size*/
    var writeCborSize = function(typeVal, size) {
      if(size < 0x18) { //24
        appendTemp((typeVal + size) & 0xff);
          return;
      }
      if(size < 0x100) { //256
        appendTemp((typeVal + 24) & 0xff);
        appendTemp(size & 0xff);
           return;
      }
      if(size < 0x10000) { //65536
        appendTemp((typeVal + 25) & 0xff);
        appendTemp((size >> 8) & 0xff);
        appendTemp((size & 0xff));
          return;
      }
      if(size < 0x100000000) { //4294967296
        appendTemp((typeVal+26) & 0xff);
        appendTemp((size >> 24) & 0xff);
        appendTemp((size >> 16) & 0xff);
        appendTemp((size >>  8) & 0xff);
        appendTemp((size & 0xff));
          return;   
      }
      appendTemp((typeVal+27) & 0xff);
      appendTemp((size >> 56) & 0xff);
      appendTemp((size >> 48) & 0xff);
      appendTemp((size >> 40) & 0xff);
      appendTemp((size >> 32) & 0xff);
      appendTemp((size >> 24) & 0xff);
      appendTemp((size >> 16) & 0xff);
      appendTemp((size >>  8) & 0xff);
      appendTemp((size & 0xff));
        return;
    };
  
  
    /**Decodes the current collection of Buffers into a js array of objects
     * Clears the buffers when called*/
    var decodeAll = function () {
      var ret = [];
      while(peekByte()!==null) { //while there is stuff left to get
        let d = getNext();
        if(d) ret.push(d);
      }
      clear(); //clear the internal buffers for next time
      return ret;
    };
  
    /**Constr given one a js Buffer of CBOR bytes.
     * Also can accept an array of Buffers (or none)*/
    //var RtCbor = function(aBuffer) {
    //  addCborBuffer(aBuffer);
    //};
    
    // ----------------
    // Closure Return:
    // ----------------
    return {
      
      //These functions represent the public API:
      //RtCbor:RtCbor, //constr
      clear:clear,
      addCborBuffer:addCborBuffer,
      decodeAll:decodeAll,
  
      encodeArray:encodeArray,
      encodeOMap:encodeOMap,
      encodeString:encodeString,
      getCborAsBuffer: getCborAsBuffer
    }; //closure return
    
  }()); //namespace rtCbor
  
  export default rtCbor;