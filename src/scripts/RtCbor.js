/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */ //for jslint
/*globals */ //for jslint

"use strict";

/**Utility to provide conversion between CBOR data and Javascript objects.
 * Collections can be unbounded Arrays or Omaps (which are arrays with an attributes object at the first location)
 * Notes:
 *    o Primitives types are Strings, boolean, NULL
 *    o Collections types are Array and Omap
 *    o Fixed cbor arrays are not supported
 */

//const Tagged = require('./tagged'); //experiment using cbor tagged function

class RtCbor {

  /**Constructor*/
  constructor() {
    this.buffers = [];    //array of type js Buffer. Holds the CBOR bytes
    this.whichBuffer=0;   //index into which buffer is currenly being used
    this.curpos=0;        //cursor into buffers[whichBuffer]
    this.tempBytes = [];  //temp js array used to assemble Buffer entries
  }


  /**Append a new Buffer with CBOR bytes. Can be array of Buffers as well*/
  addCborBuffer(aBuffer) {
    let argCnt = arguments.length;
    switch(argCnt) {
      case 0:  //no entries
        break;  
      case 1:  //single Buffer entry
        this.buffers.push(aBuffer);
        break;
      default: //multiple Buffer entries
        for(let i=0; i<arguments.length; i++) {
          this.buffers.push(arguments[i]);
        }
        break;
    }
  }
  
  /**Clears out the all internal buffers*/
  clearAll() {
    this.buffers=[];
    this.whichBuffer=0;
    this.clearTemp();
  }

  
  // ------------------
  // Reading methods:
  // ------------------


  /**Decodes the current collection of Buffers into a js array of objects.
   * Clears the buffers in the process.
   * The data to be read can be provided in this call instead of making separate calls to addCborBuffer()
   * */
  decodeAll(message) {
    if(message)
      this.addCborBuffer(message);

    let ret = [];
    let peek = this.peekByte();
    while(peek) { //while there is stuff left to get
      let val = this.getNext();
      if(val) ret.push(val);
      peek = this.peekByte();
    }
    this.clearAll(); //clear the internal buffers for next time
    return ret;
  }

  /**Returns true at the array end marker (0xff)*/
  atArrayEnd() {
    let b = this.peekByte();
    return (b===null) || (b===undefined) || ((b & 0xff) === 0xff);
  }

  /**Returns the next item: string array, boolean, byte array, omap, string, or null*/
  getNext() {
    let peek = this.peekByte();
    if(peek===null || peek===undefined) return null; //nothing left to get

    let theType = this.getType();
    switch(theType) {
      case "Array":        return this.getArray();
      case "BoolTrue":     return this.getBool(true);
      case "BoolFalse":    return this.getBool(false);
      case "Bytes":        return this.getByteArray();
      //case "Float":      return this.getDouble();
      //case "FloatArray": return this.getDoubleArray();
      //case "Integer":    return this.getLong();
      case "Omap":         return this.getOmap();
      case "String":       return this.getString();
      case "Null":         return this.getNull();
      default:
        console.error('RtCbor Error. Unrecognized type: ' + theType);
        this.nextByte(); //ISSUE: how to know how many bytes to skip when don't know what it is?
        return null; //TODO: throw an exception instead?
    }
  }

  /**Peeks at the next 1 or 2 bytes and returns a string representing the type:
   * e.g. end, empty, Bytes, String, Integer, Omap, Array, Uri, Tag, Float, Null, Boolean*/
  getType() {
    let tag = this.peekByte();
    if(tag===null || tag===undefined) return "end";
    if(this.buffers.length===0) return "empty";

    switch(tag & 0xe0) {
      case 0x40: return "Bytes";
      case 0x60: return "String";
      case 0x00: return "Integer";
      case 0x20: return "Integer";
      case 0xc0: {
        let tagValue = this.nextCborSize(); //long
        if(tagValue === 32) {  //look for URI
          this.skip(tag);           //skip the string
          return "Uri";
        }
        return "Tag";
      }
    }
    switch(tag & 0xff) {
      case 0x9f: { //indefinite Array
        let checkit = this.peekByte2(); //check the byte after the current byte
        if((checkit & 0xff) === 0xd3) { //omap tag2 byte
          this.nextByte(); //skip the 9f tag, leaving it on d3
          return "Omap";
        }
        return "Array";
      }
      case 0xfb: return "Float"; 
      case 0xf6: return "Null";  
      case 0xf5: return "BoolTrue";  // true
      case 0xf4: return "BoolFalse"; // false
    }
    return "unknown";
  }

  /**Called when the next item is a Boolean
   * Returns a boolean*/
  getBool(b) {
    this.nextByte(); //dump the tag byte (not needed for this type)
    return b;    
  }

  /**Called when the next item is a NULL
   * Returns a null*/
  getNull() {
    this.nextByte(); //dump the tag byte (not needed for this type)
    return null;
  }

  /**Called when the next item is a String
   * Returns a string*/
  getString() {
    let size = this.nextCborSize(); //this is the reason the tag byte is left in place so can do this with it
    let theBytes = this.nextBytes(size);
    return this.bytesToString(theBytes);
  }

  /**Called when the next item is a byte array. Returns values in a js array[]*/
  getByteArray() {
    let size = this.nextCborSize(); //this is the reason the tag byte is left in place so can do this with it
    return this.nextBytes(size);
  }

  /**Called when the next item is an Array
   * Returns an array containing strings, arrays, omaps*/
  getArray() {
    this.nextByte(); //dump the tag byte (not needed for this type)
    let rtn = [];
    while(!this.atArrayEnd()) {
      let val = this.getNext(); //get the next item: String, Array, Omap...
      if(val) rtn.push(val);
    }
    this.nextByte(); //clear off the array end byte
    return rtn;
  }

  /**Called when the next item is an omap
   * This version returns a js array where the first entry is an attributes map and subsequent entries are the alternating key/values successively.
   *    [ {value: <omapName>}, key1, val1, key2, val2, ... ]
   * Each val can be a string, key/val list[], or another omap
   */
  getOmap() { // ==> getOmap As array with entry[0]=Attributes
    let tag = this.peekByte(); //DEBUG
    let tag2 = this.nextByte(); //dump the tag2 byte (0xd3)
    let omapName = this.getNext();  //omap name (which is also the thing that used to be called the target widgetId)
    let attribs = { tag: tag, tag2: tag2, value: omapName };

    let valArray = [];
    valArray.push(attribs);
    while(!this.atArrayEnd()) {
      let val = this.getNext(); //get the next item: String, Array, Omap...
      if(val) valArray.push(val);
    }
    this.nextByte(); //clear off the array end byte
    return valArray;
  }
  /* */

  /*Trial. An internal 'Tagged' object to duplicate the other cbor library* /
  function Tagged(attribs, entries) {
    let result = [];
    result.push(attribs);
    if(entries) {
      for(let i=0; i<entries.length; i++) {
        result.push(entries[i]);
      }
    }
    return entries;
  }
  /* */

  /**Called when the next item is an omap
   * This version returns a js array where the first entry is an attributes map and subsequent entries are the alternating key/values successively.
   *    [ Tagged { value: <omapName> }, key1, val1, key2, val2, ... ]
   * Each val can be a string, key/val list[], or another omap
   * /
  getOmap() { //getOmap using TaggedConstructor
    this.nextByte(); //dump the tag2 byte (0xd3)
    let valArray = [];
    let omapName = this.getNext();  //omap name (which is also the thing that used to be called the target widgetId)
    let attribs = {
      value: omapName
    };
    //valArray.push(attribs);
    while(!this.atArrayEnd()) {
      let val = this.getNext();
      if(val) valArray.push(val);
    }
    this.nextByte(); //clear off the array end byte

    //const t = new Tagged('19', omapName); //using cbor library 'Tagged' function
    //let tagged = t.convert(this.tags);

    let tagged = new Tagged(attribs, valArray); //using locally defined 'Tagged' function
    return tagged;
  }
  /* */

  /**Called when the next item is an omap
   * Returns an array with the omap name as .omapName
   * The entries are key/values stored successively at array locations
   * Each value can be a string, key/val list[], or another omap
   * /
  getOmap() { //getOmapAsNamedArray
    this.nextByte(); //dump the tag2 byte (0xd3)
    let ret = [];
    ret.omapName = this.getNext(); //omap name (which is also the thing that used to be called the target widgetId)
    while(!this.atArrayEnd()) {
      let nextOne = this.getNext();
      if(nextOne) ret.push(nextOne);
    }
    this.nextByte(); //clear off the array end byte
    return ret;
  }
  /* */

  /**Called when the next item is an omap
   * This version reurns as a map with the name accessible as .omapName
   * The entries are key/values of the map
   * Entries with multiple values for the same key show us as an array instead of a string
   * Each value can be a string, key/val list[], or another omap
   * /
  getOmap() { //getOmapAsMap
    this.nextByte(); //dump the tag2 byte (0xd3)
    let ret = {};
    ret.omapName = this.getNext(); //omap name (which is also the thing that used to be called the target widgetId)
    while(!this.atArrayEnd()) {
      let key = this.getNext();
      let val = this.getNext();
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
    this.nextByte(); //clear off the array end byte
    return ret;
  }
  /* */

  /**Computes the CBOR size of the next element
   * Advances the cursor
   * */
  nextCborSize() {
    let tag = this.nextByte() & 0x1f;
    if(tag < 24) return tag;
    let cnt = 0;
    switch(tag & 0xff) {
      case 24: cnt = 1; break;
      case 25: cnt = 2; break;
      case 26: cnt = 4; break;
      case 27: cnt = 8; break;
    }
    let tmp = 0;
    for(let i=0; i<cnt; i++) {
      tmp = tmp << 8;
      tmp = tmp | (this.nextByte() & 0xff);
    }
    return tmp;
  }

  /**Returns the requested number of bytes from the input buffers, as a js array[].
   * Advances the read curpos*/
  nextBytes(len) {
    let rtn = [];
    for(let i=0; i<len; i++) {
      let abyte = this.nextByte();
      if(abyte)
        rtn.push(abyte);
      else break; //ran out of bytes early
    }
    return rtn;
  }

  /**Returns the next byte in the input Buffers. Increments the cursor*/
  nextByte() {
    if(this.whichBuffer < this.buffers.length) {
      let buff = this.buffers[this.whichBuffer];
      if(this.curpos < buff.length) {
        let b = buff.readInt8(this.curpos++);  //note: auto-increment curpos
        return b;
      }
      else { //next Buffer in the list & 0xff
        this.whichBuffer++; //nextBuffer
        this.curpos=0;      //start at the the beginning
        return this.nextByte(); //recursive call to get first byte of next entry
      }
    }
    else return null; //no more data
  }

  /**Peeks the next byte in the input buffers, does not increment the cursor*/
  peekByte() {
    if(this.whichBuffer < this.buffers.length) { //get current buffer being read
      let buff = this.buffers[this.whichBuffer];
      if(this.curpos < buff.length) {
        let b = buff.readInt8(this.curpos); //note: no auto-increment
        return b & 0xff;
      }
      else { //next Buffer in the list
        this.whichBuffer++; //nextBuffer
        this.curpos=0;      //start at the the beginning
        return this.peekByte(); //recursive call to get first byte of next entry
      }
    }
    else return null; //no more data (no more Buffers) available
  }

  /**Peeks the byte after the next byte in the input Buffers, does not increment the cursor*/
  peekByte2() {
    var buff;
    if(this.whichBuffer < this.buffers.length) { //get current buffer being read
      buff = this.buffers[this.whichBuffer];
      if(this.curpos+1 < buff.length) {
        let b = buff.readInt8(this.curpos+1); //note: no auto-increment
        return b & 0xff;
      }
      return null; //do this instead of all the stuff below. Shouldn't ever land here anyway so all that complexity just for technical correctness is a waste
      //NOTE: TEST THIS SOMETIME? The thing is, not needed because peekByte2 is only ever gooing to be called after peekByte, which means whichBuffer was already incremented
      // let pastLastByte=false;
      // if(this.curpos==buff.length) {
      //   pastLastByte=true;
      // }
      // else { //next Buffer in the list
      //   if(this.whichBuffer+1 < this.buffers.length) { //get the next buffer, if any
      //     buff = this.buffers[this.whichBuffer+1];
      //     let tempCurpos = pastLastByte ? 1 : 0;
      //     if(0 < buff.length) {
      //       let b = buff.readInt8(tempCurpos); //note: no auto-increment
      //       return b & 0xff; 
      //     }
      //   }
      //   else return null; //no more data (no more Buffers) available
      // }
    }
    else return null; //no more data (no more Buffers) available
  }

  /**Skips a complete element.
   * Assumes the identifying tag was already read (so it must be passed in)
   * Sets cursor to next item*/
  skip(tagByte) {
    var b, skipSize;
    if(tagByte === 0x9f) {
      b = this.peekByte();
      if(b===null || b===undefined) return null; //nothing left to get
      while( (b!==null) && (b!==undefined) && ((b & 0xff)!==0xff) ) {
        b = this.nextByte();
      }
      this.nextByte(); //clear the array end byte 0xff
    }
    else {
      skipSize = 0;
      if( (tagByte & 0xff) === 0xff) {
        this.nextByte();
        return;
      }
      if((tagByte & 0xe0) === 0x40) {
        skipSize = this.nextCborSize();
        for(let i=0; i<skipSize; i++) this.nextByte();
      }
      if((tagByte & 0xe0) === 0x60) {
        skipSize = this.nextCborSize();
        for(let i=0; i<skipSize; i++) this.nextByte(); //skip bytes
      }
      if((tagByte & 0xe0) === 0x00) this.nextCborSize();
      if((tagByte & 0xe0) === 0x20) this.nextCborSize();
      if((tagByte & 0xff) === 0xfb) {
        for(let i=0; i<9; i++) this.nextByte(); //skip float, 8 bytes+1
      }
      if((tagByte & 0xe0) === 0xc0) {
        let size = this.nextCborSize();
        if(size === 32) {  //look for URI
          this.skip(this.nextByte()); //skip the string
          return;
        }
      }
      
      //Note: byte was already read so nothing actually needs to happen here. Including it just for completeness:
      switch(tagByte & 0xff) {
        case 0xf6: //null
        case 0xf5: //true
        case 0xf4: //false
      }
    }
  }


  // ------------------
  // Writing methods:
  // ------------------


  /**Low level append a byte to this buffer*/
  appendTemp(b) {
    this.tempBytes.push(b);
  }

  /**Low level append an array of bytes to this buffer*/
  appendByteArray(bytes) {
    if(!bytes || !bytes.length) return; //nothing to do
    for(var i=0; i<bytes.length; i++) {
      this.tempBytes.push(bytes[i]);
    }
  }

  /**Saves off the temp byte buffer as an entry in buffers array
   * Clears the temp buffer for the next batch of writes*/
  pushTemp() {
    if(this.tempBytes.length>0) { //only push it if it contains something useful
      this.addCborBuffer(Buffer.from(this.tempBytes));
      this.clearTemp();
    }
  }

  /**Clears out internal temporary buffer used to build up commands*/
  clearTemp() {
    this.tempBytes = [];
    this.curpos=0;
  }

  /**Adds a string array*/
  encodeArray(val) {
    this.appendTemp(0x9f); //starts an unbounded array

    if(val) {
      for(let i=0; i < val.length; i++) {
        this.encodeString(val[i]);
      }
    }
    this.appendTemp(0xff); //unbounded collection end byte
    this.pushTemp(); //put away the temp buffer
  }

  encodeArrayNew(val) {
    this.appendTemp(0x9f); //starts an unbounded array
    this.appendTemp(0xd3); //adds the tag for the initial omap at the start

    if(val) {
      for(let i=0; i < val.length; i++) {
        this.encodeString(val[i]);
      }
    }
    this.appendTemp(0xff); //unbounded collection end byte
    this.pushTemp(); //put away the temp buffer
  }

  /**Apppends a null entry*/
  encodeNull() {
    this.appendTemp(0xf6); //append a NULL entry
  }

  /**Appends a named map.
   * Note: if name is null then is an unnamed map
   * If map is null then this simply emits a null*/
  encodeOMap(name, map) {
    if(map === null || map === undefined) {
      this.encodeNull();
    }
    else {
      this.startOmap(name);
      for(var key in map) {
        if(Object.prototype.hasOwnProperty.call(map, key)) {
          this.encodeString(key);      //save the key
          this.encodeString(map[key]); //save the value
        }
      }
      this.appendTemp(0xff); //unbounded collection end byte
      this.pushTemp(); //put away the temp buffer
    }
  }

  /**Appends a string*/
  encodeString(value) {
    if(value === null || value === undefined) {
      this.encodeNull();
    }
    else {
      let size = value ? value.length : 0;
      this.writeCborSize(0x60, size);
      this.appendByteArray(this.stringToBytes(value));
    }
  }

  /**Returns a Buffer containing the CBOR representing all of the previous encode() calls.
   * Clears out the buffer for subsequent operations*/
  getCborAsBuffer() {
    this.pushTemp(); //do a final temp buffer save in case there are some bytes remaining
    let ret = Buffer.concat(this.buffers); //concatentate all the internal buffers to one
    this.clearAll(); //clear the internal buffers
    return ret;
  }



  /**Starts an unbounded ordered map of name
   * if name is null or empty string then is a nameless omap
   * which is equivalent to a map*/
  startOmap(name) {
    this.appendTemp(0x9f);
    this.appendTemp(0xd3);  //omap tag
    if(name === null || name === undefined || name.length === 0 ) {
      this.encodeNull();
    }
    else {
      this.encodeString(name); //omap name
    }
  }

  /**Writes cbor size entry. Note: allows up to a 63 bit int (must be positive)
   * Given arguments of integer typeVal, integer size*/
  writeCborSize(typeVal, size) {
    if(size < 0x18) { //24
      this.appendTemp((typeVal + size) & 0xff);
      return;
    }
    if(size < 0x100) { //256
      this.appendTemp((typeVal + 24) & 0xff);
      this.appendTemp(size & 0xff);
      return;
    }
    if(size < 0x10000) { //65536
      this.appendTemp((typeVal + 25) & 0xff);
      this.appendTemp((size >> 8) & 0xff);
      this.appendTemp((size & 0xff));
      return;
    }
    if(size < 0x100000000) { //4294967296
      this.appendTemp((typeVal+26) & 0xff);
      this.appendTemp((size >> 24) & 0xff);
      this.appendTemp((size >> 16) & 0xff);
      this.appendTemp((size >>  8) & 0xff);
      this.appendTemp((size & 0xff));
      return;   
    }
    this.appendTemp((typeVal+27) & 0xff);
    this.appendTemp((size >> 56) & 0xff);
    this.appendTemp((size >> 48) & 0xff);
    this.appendTemp((size >> 40) & 0xff);
    this.appendTemp((size >> 32) & 0xff);
    this.appendTemp((size >> 24) & 0xff);
    this.appendTemp((size >> 16) & 0xff);
    this.appendTemp((size >>  8) & 0xff);
    this.appendTemp((size & 0xff));
    return;
  }


  // ---------------------------------
  // MISCELLANEOUS UTILITY FUNCTIONS:
  // ---------------------------------

  /**Converts string to byte array*/
  stringToBytes(astring) {
    let rtn=[];
    for(let i=0; i<astring.length; i++) 
      rtn.push(astring.charCodeAt(i));
    return rtn;
  }

  /**Converts byte[] of ASCII byte to a string*/
  bytesToString(bytes) {
    let cnt = bytes.length;
    let rtn = '';
    for(let i=0; i<cnt; i++) {
      rtn += String.fromCharCode(bytes[i]);
    }
    return rtn;    
  }

}
  
//export default RtCbor;
module.exports = RtCbor;
