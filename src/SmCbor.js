/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */ //for jslint
/*globals console*/ //for jslint

/**CBOR class based on the Java class SmCborBuffer (in rtalk.sm)*/

/**Original Java description:
 * Limited CBOR conversion buffer for use with MQTT messages
 * Collections can be unbounded Arrays<CBOR> or Omaps<String,CBOR> (fixed size not supported)
 * Primitives are Strings, byte[], Double, Long, boolean, null
 * Strings are limited to single byte utf8
 * @author markroos
 */
/**module definition*/
var smCbor = (function () {
  "use strict"; //enable javascript strict mode
  
  //Dependencies:
  //-------------
  
  //Closure local variables:
  //------------------------
  var
    buf = [],  //byte array
    curpos=0,  //points at next spot to write
    maxCur     //max cursor location during a rewind() call
    ;
  
  /**Clears out the contents of the buffer by reseting pointers*/
  var clear = function() {
    buf = [];
    curpos=0;
    maxCur=0;
  };
  
  var setCursor = function(pos) {
  //public int setCursor(int pos) {
    let rtn = curpos;
    curpos = pos;
    return rtn;
  };
  
  /**drops the leading bytes up to the current cursor location
   * Used to drop messages already processed*/
  var dropToCursor = function() {
  //public void dropToCursor() {
    buf = buf.slice(curpos, buf.length); //Arrays.copyOfRange(buf, curpos, buf.length);
    maxCur = buf.length;
    curpos = 0;
  };
  
  /**set to the size of the valid space in the contents byte[]*/
  var setContentsSize = function(pos) {
  //public void setContentsSize(int pos) {
    maxCur = pos;
  };
  
  var getCursor = function() {
  //public int getCursor() {
    return curpos;
  };
  
  /**moves the cursor one towards the start from the end
   * used to backup over an omap or array end when the last one
   * in the buffer is the focus*/
  var backupOverEnd = function() {
  //public void backupOverEnd() {
    if(maxCur > curpos) curpos = maxCur;
    curpos--;
  };

  /**set the cursor to the start position, remember this as maxWrite*/
  var rewind = function() {
  //public void rewind() {
    if(curpos > maxCur) maxCur = curpos;
    curpos = 0;
  };

  /**Returns size of the buffer
   * truncates to the larger of curpos or maxCur*/
  var size = function() {
  //public int size() {
    let max = maxCur;
    if(curpos > maxCur) {
      max = curpos;
    }
    return max;
  };

  /**Returns true if no more to process*/
  var atEnd = function() {
  //public boolean atEnd() {
    if(buf.length === 0) return true;
    if(curpos >= buf.length) return true;
    if(maxCur !== 0 && curpos >= maxCur) return true;
      return false;
  };

  var isEmpty = function() {
  //public boolean isEmpty() {
    return (curpos === 0 && maxCur === 0);
  };

  // CBOR support methods
  // -----------------------
  
  /**converts java string to ASCII byte array*/
  var stringToBytes = function(astring) {
  //private static byte[] stringToBytes(String string) {
    let rtn=[];  //byte[] rtn = astring.getBytes("ISO-8859-1");
    for(let i=0; i<astring.length; i++) 
      rtn.push(astring.charCodeAt(i));
    return rtn;
  };
  
/**converts byte[] of ASCII byte to a java string*/
  var bytesToString = function(bytes) {
  //private static String bytesToString(byte[] bytes) {
    let cnt = bytes.length;
    let rtn = ""; //String rtn = (new String(bytes, "ISO-8859-1"));
    for(let i=0; i<cnt; i++)
      rtn += String.fromCharCode(bytes[i]);
    return rtn;    
  };
  
  /**Computes the CBOR size of the next element (this == value for int data items)
   * limited to 63 bits, positive int
   * advances the cursor
   * */
  var nextCborSize = function() {
  //private long nextCborSize() {
    let tag = buf[curpos++] & 0x1f;
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
      tmp = tmp + (buf[curpos++] & 0xff);
    }
    return tmp;
  };
  
  /**DWH - extended to allow up to 63 bits (positive int)*/
  var writeCborSize = function(type, size) {
  //private void writeCborSize(int type, long size) {
     if(size < 24) {
       append((type + size) & 0xff);
         return;
     }
    if(size < 256) {
      append((type + 24) & 0xff);
      append(size & 0xff);
         return;
    }
    if(size < 65536) {
      append((type + 25) & 0xff);
      append((size >> 8) & 0xff);
      append((size & 0xff));
         return;
     }
     if(size < 4254967296) {
       append((type + 26) & 0xff);
       append((size >> 24) & 0xff);
       append((size >> 16) & 0xff);
       append((size >> 8) & 0xff);
       append((size & 0xff));
         return;   
     }
     append((type + 27) & 0xff);
     append((size >> 56) & 0xff);
     append((size >> 48) & 0xff);
     append((size >> 40) & 0xff);
     append((size >> 32) & 0xff);
     append((size >> 24) & 0xff);
     append((size >> 16) & 0xff);
     append((size >> 8) & 0xff);
     append((size & 0xff));
       return;
  };

  /**peeks the next byte and returns a string for the type
   * end, empty, Bytes, String, Integer, Omap, Array, Uri ,Tag
   * */
  var type = function() {
  //public String type() {
    if(atEnd()) return "end";
    if(isEmpty()) return "empty";
    let tag = buf[curpos]; //byte
    switch(tag & 0xe0) {
      case 0x40: return "Bytes";
      case 0x60: return "String";
      case 0x00: return "Integer";
      case 0x20: return "Integer";
      case 0xc0:
        let tagValue = nextCborSize(); //long
        if(tagValue === 32) {  //look for URI
          skip();              //skip the string
          return "Uri";
        }
        return "Tag";
    }
    switch(tag) {
      case 0x9f:  //indefinite Array
        if(buf[curpos+1] === 0xd3) //omap tag
          return "Omap"; 
        return "Array";
      case 0xfb: return "Float"; 
      case 0xf6: return "Null";  
      case 0xf5: return "Boolean"; // true
      case 0xf4: return "Boolean"; // false
    }
    return "unknown";
  };
  
  /**Skips all elements inside this collection. Sets cursor to next item
   * initial level must be 0.  Returns true if finished*/
  var skip = function() {
  //public void  skip() {
    if(buf[curpos] === 0x9f) {
      curpos++;
      while( !atEnd() && buf[curpos] !== 0xff)skip();
      curpos++;
    }
    else {
      let tag = buf[curpos]; //byte
      let skipSize = 0; //int
      if(tag === 0xff) return;
      if((tag & 0xe0) === 0x40) {
        skipSize = nextCborSize();  // bytes
        curpos = curpos + skipSize;
      }
      if((tag & 0xe0) === 0x60) {
        skipSize = nextCborSize();  // string
        curpos = curpos + skipSize;
      }
      if((tag & 0xe0) === 0x00) nextCborSize();  // long
      if((tag & 0xe0) === 0x20) nextCborSize();  // long
      if(tag === 0xfb) curpos = curpos + 9; // float 8 bytes
      if((tag & 0xe0) === 0xc0) {
        let tagValue = nextCborSize();  //long
        if(tagValue === 32) {  // look ofr URI
          skip();             // skip the string
          return;
        }
      }
      if(tag === 0xf6) curpos++;  //null
      if(tag === 0xf5) curpos++; // true
      if(tag === 0xf4) curpos++; // false
    }
  //  return;
  };

  var skipArrayStart = function() {
  //public void skipArrayStart() {
    curpos++;
  };

  var nextItem = function() {
  //public byte[] nextItem() {
    if(atEnd()) return null;
    let start = curpos; //int
    skip();
    return buf.slice(start, curpos); //Arrays.copyOfRange(buf, start, curpos);
  };

  // CBOR public methods
  // -----------------------
  // Collection support
  
  /**starts an unbounded array*/
  var startArray = function() {
  //public void startArray() {
    append(0x9f);
  };

  var atArrayEnd = function() {
  //public boolean atArrayEnd() {
    return buf[curpos] === 0xff;
  };

  /**starts an unbounded ordered map of name
   * if name is null or empty string then is a nameless omap
   * which is equivalent to a map*/
  var startOmap = function() {
  //public void startOmap(String name) {
    append(0x9f);
    append(0xd3);  // omap  tag
    if(name === null || name.isEmpty()) {
      putNull();
    }
    else {
      putString(name);     // tag
    }
  };
  
  /**write the end byte for an unbounded collection*/
  var end = function() {
  //public void end() {
    append(0xff);
  };

  //TODO? is this one needed?
  ///**Assumes that there are key values in the buffer
  // * starting from current position looks for a match for the key, which is a string.
  // * Returns the next CBOR object or null*/
  //var searchFor = function(key) {
  ////public Object searchFor(String key) {
  //  let target = stringToBytes(key); //byte[] target = stringToBytes(key);
  //  let match = false; //boolean
  //  let value = null; //Object
  //  while(value === null) {
  //    while(!match) {
  //      match = buf[curpos] === target[0];
  //      curpos++;
  //    }
  //    if(!match) return null;
  //    if(getString().toUpperCase()===key.toUpperCase()) //if(getString().equalsIgnoreCase(key))
  //      value = getObject();
  //  }
  //  return value;
  //};
  
  // ------------------------------
  // append() and put() functions:
  // ------------------------------

  /**Append to this buffer*/
  var append = function(b) {
  //public void append(byte b) {
    //if((curpos + 1) >= buf.length) {
    //  //let newLen = buf.length * 2;
    //  let newBuf = []; //    byte[] newBuf=new byte[newLen];
    //  let len=buf.length;
    //  for(let i=0; i<len; i++)
    //    newBuf[i]=buf[i];
    //  buf=newBuf;
    //}
    buf[curpos++]=b;
  };

  /**Low level append of a byte array to this buffer*/
  var appendByteArray = function(data) {
  //public void append(byte[] data) {
    //if((curpos + data.length) >= buf.length) {
    //  let newLen = buf.length * 2;
    //  if(curpos + data.length > newLen) newLen = newLen + data.length;
    //  let newBuf = []; //byte[] newBuf=new byte[newLen];
    //  let len=buf.length;
    //  for(let i=0; i < len; i++)
    //    newBuf[i]=buf[i];
    //  buf=newBuf;
    //}
    for(let i=0; i < (data.length); i++) {
      buf[curpos++]=data[i];
    }
  };

  //TODO? is this generic one even needed?
  //var put = function(val) {
  ////public void put(Object val) {
  //  if(val === null) {
  //    putNull();
  //    return;
  //  }
  //  Class clazz = val.getClass();
  //  if(clazz === String.class)       putString(val);   
  //  else if(clazz === Long.class)    putLong(val);   
  //  else if(clazz === Integer.class) putInteger(val);   
  //  else if(clazz === Double.class)  putDouble(val);   
  //  else if(clazz === Float.class)   putDouble(val);   
  //  else if(val instanceof byte[])   putByteArray(val);
  //  else if(val instanceof String[]) putStringArray(val);
  //};

  /**Writes java string to an ASCII byte limited utf-8*/
  var putString = function(value) {
  //public void put(String value) {
    if(value === null) {
      putNull();
      return;
    }
    let size = value.length(); //int
    writeCborSize(0x60, size);
    appendByteArray(stringToBytes(value));
  };

  /**write a tag type*/
  var putTag = function(tag) {
  //public void putTag(int tag) {
    writeCborSize(0xc0, tag);
  };

  /**insert a uri which is tag(32) + string*/
  var putSmUri = function(uri) {
  //public void put(SmUri uri) {
    putTag(32);
    putString(uri.getUri()); //TODO? SmUri object with getUri() function?
  };

  /**Writes a pair of java strings to an ASCII byte limited utf-8
   * used for key values in omaps
   */
  var putKeyVal = function(key, val) {
  //public void put(String key, String val) {
    putString(key);
    putString(val);
  };

  /**add an string array*/
  var putStringArray = function(val) {
  //public void put(String[] val) {
    startArray();
    for(let i = 0; i < val.length; i++) {
      putString(val[i]);
    }
    end();
  };

  /**add an unnamed omap from a map*/
  var putMap = function(map) {
  //public void put(Map<String,String> map) {
    startOmap(null);
    for(var key in map) { //map.forEach((k,v)-> put(k,v));
      if(map.hasOwnProperty(key)) {
        putKeyVal(key, map[key]);
      }
    }
    end();
  };
 
   /**Write a integer number as a CBOR data item
   * Deals with positive and negative numbers up to 64 bits
   *  using minimum space required based on value of number
   * @param value
   */
  var putLong = function(value) {
  //public void put(long value) {
    if(value < 0) {
      value = -value - 1;  //unsigned value to be stored in buffer
      writeCborSize(0x20, value);
    }
    else {
      writeCborSize(0x00, value);
    }
  };

  /**Write double value as CBOR data item*/
  var putDouble = function(dval) {
  //public void put(double dval) {
    append((0xe0 + 27));  //double precision float
    //byte[] b = ByteBuffer.allocate(8).putDouble(dval).array();
    var b = new ArrayBuffer(8);         //note: js numbers are 64 bits
    var longNum = new Float64Array(b);  //so equivalent to Float64
    longNum[0] = dval;
    let b2 = Array.from(new Int8Array(b)).reverse();  // reverse to get little endian
    append(b2);  
  };
 
  /**Write double[] value as CBOR typed array item*/
  var putDoubleArray = function(dval) {
  //public void put(double[] dval) {
    putTag(86); // little endian typed double array
    //ByteBuffer buffer = ByteBuffer.allocate(8 * dval.length);
    let buffer = [];
    //set LITTLE_ENDIAN //TODO?
    for(let value in dval) {
      if(dval.hasOwnPropery(value))
        buffer.putDouble(value);
    }
    putByteArray(buffer.array()); //double check that the one we want here is the cbor putByteArray() and not the low level appendByteArray()
  };

  /**write a byte[]*/
  var putByteArray = function(value) {
  //public void put(byte[] value) {
    if(value === null) {
      putNull();
      return;
    }
    let size = value.length;
    writeCborSize(0x40, size);
    append(value);
  };

  /**write a true or false*/
  var putBool = function(bool) {
  //public void put(boolean bool) {
    if(bool)
      append(0xf5);
    else
      append(0xf4);   
  };

  var putNull = function() {
  //public void putNull() {
    append(0xf6);
  };

  var putSmOmap = function(omap) { 
  //public void put(SmOmap omap) {
    if(omap === null) {
      putNull();
      return;
    }
    appendByteArray(omap.toBytes()); //note: SmOmap is an object of type SmCbor
  };
  
  var putOmapFromRiri = function(riri) {
  //public void putOmapFromRiri(String riri) {
    insertRiri(riri);
  };

  var putSmArray = function(array) {
  //public void put(SmArray array) {
    if(array === null) {
      putNull();
      return;
    }
    appendByteArray(array.toBytes()); //note: SmArray is an SmCbor object
  };

 // --------------------
 // get...() functions:
 // --------------------
 
  /**get the requested number of bytes starting at curPos. advances curPos*/
  var getBytes = function(len) {
  //private byte[] getBytes(int len) {
    let rtn = buf.slice(curpos, curpos + len); //byte[] rtn = Arrays.copyOfRange(buf, curpos, curpos + len);
    curpos = curpos + len;
    return rtn;
  };

  var getObject = function() {
  //public Object getObject() {
    if(atEnd()) return null;
    let type = type(); //String
    if(type==="String")  return getString();
    if(type==="Bytes")   return getByteArray();
    if(type==="Integer") return getLong();
    if(type==="Float")   return getDouble();
    if(type==="Array")   return getArray();
    if(type==="Boolean") return getBoolean();
    if(type==="Omap")    return getOmap();
    if(type==="Null") {
      curpos++;
      return null;
    }
    return null;
  };
  
  var getBuffer = function() {
  //public byte[] getBuffer() {
    return buf;
  };
  
  
  /**Returns this buffer as a byte array
   * truncates to the larger of curpos or maxCur*/
  var toBytes = function() {
  //public byte[] toBytes() {
    let max = maxCur;
    if(curpos > maxCur) {
      max = curpos;
    }
    if(max === buf.length) return buf;
    return buf.slice(0, max); //Arrays.copyOfRange(buf, 0, max);
  };
  
  /**Expects next value to be a string or a bytes[] which is ASCII 
   * and returns a java string.  Returns null if not a string
   * if its a null drops the null*/
  var getString = function() {
  //public String getString() {
  if(curpos >= buf.length) return null;
    let tag = buf[curpos]; //byte
    if(tag === 0xf6) {
      curpos = curpos + 1;
      return null;
    }
    tag = (0xe0 & tag);    
    if(!((tag === 0x60) || (tag === 0x40))) {
      return null; // string or byte
    }
    let size = nextCborSize();
    return bytesToString(getBytes(size));
  };

  /**Expects next value to be a string or a bytes[] which is ASCII 
   * Replaces the bytes with ASCII spaces (0x20)
   * leaves the cursor pointing at the next object
   * @param  pos is the index of the start of the string*/
  var eraseString = function(pos) {
  //public void eraseString(int pos) {
    if(pos >= buf.length) return;
    let tag = buf[pos]; //byte
    tag = (0xe0 & tag);
    if(!((tag === 0x60) || (tag === 0x40))) {
      return; // not a string or byte[]
    }
    curpos = pos;
    let size = nextCborSize();  //int
    for(let i=curpos; i<curpos+size; i++) {
      buf[i] = 0x20;
    }
    return;
  };

  /**Get the next cbor data item which is assumed to be a positive or negative integer*/
  var getLong = function() {
  //public long getLong() {
     if(curpos >= buf.length) return 0;    //this is really an error
       let tag = buf[curpos]; //byte
       if((tag & 0xe0) === 0x00)
         return nextCborSize();
       if((tag & 0xe0) === 0x20)    //negative number
         return -nextCborSize() -1;
       return(0);    //this is really an error - i.e., item isn't a positive or negative unsigned value
  };

  /**Get the next cbor data item which is assumed to be a positive or negative integer*/
  var getTag = function() {
  //public long getTag() {
     if(curpos >= buf.length) return 0;    //this is really an error
       let tag = buf[curpos]; //byte
       if((tag & 0xe0) === 0xc0)
         return nextCborSize();
       return(0);    //this is really an error
  };

  /**Get the next cbor data item which is assumed to be a URI*/
  var getUri = function() {
  //public SmUri getUri() {
    let tagValue = getTag(); //long
    if(tagValue !== 32) return null;
    return new SmUri(getString());
  };
  
  /**Get the next cbor data item which is assumed to be a positive or negative integer*/
  var getDoubleArray = function() {
  //public double[] getDoubleArray() {
    if(curpos >= buf.length) return null;    //this is really an error
    let tag = getTag(); // should be 86
    if(tag !== 86) { 
      nextCborSize();
      return null;
    }
    let bytes = getByteArray(); //byte[]
    let ret = []; //new double[retLen]
    for(let i=0; i<bytes.length; i+=8) {
      ret.push(convertByteArrayToNumber(ret, i)); //TODO? streamline this with fewer sub-array creates
    }
    return ret;
  };

  /**Get the next cbor data item which is assumed to be a half precision, single precision or double precision float
   * Will return half and single precisions as well as double precision floats as double precision*/
  var getDouble = function() {
  //public double getDouble() {
    let dval; //double
    if(curpos >= buf.length) return 0; //really an error
    let tag = buf[curpos];
    if((tag & 0xff) === (0xe0 + 27)) {  //double precision float
      ++curpos;
      
      //WAS: dval = ByteBuffer.wrap(getBytes(8)).getDouble();
      let bytes = getBytes(8);
      let byteBuffer = new ArrayBuffer(bytes);
      dval = convertByteArrayToNumber(byteBuffer, 0, 8); //TEST THIS
      return dval;
    }
    if((tag & 0xff) === (0xe0 + 26)) {  //single precision float
      ++curpos;
      //WAS: dval = ByteBuffer.wrap(getBytes(4)).getFloat();
      let bytes = getBytes(4);
      let byteBuffer = new ArrayBuffer(bytes);
      dval = convertByteArrayToNumber(byteBuffer, 0, 4); //TEST THIS
      return dval;
    }
    if((tag & 0xff) === (0xe0 + 25)) {  //half precision float
      console.log('guruByteBuffer: nextCborDouble: msg contains half-precision float:ignore it');
    }
    return 0;      //really an error
  };

  /**if the next CBOR is a byte[] convert to a java byte[]
   * returns null if not a byte[]*/
  var getByteArray = function() {
  //public byte[] getByteArray() {
    let tag = (0xe0 & buf[curpos]) ;
    if(tag !== 0x40) {
      return null; // not byte[]
    }
    let size = nextCborSize();
    return getBytes(size);
  };

  var getBoolean = function() {
  //public boolean getBoolean() {
    let tag = buf[curpos++] & 0xff;
    if(tag === 0xf4) return false;
    return true;
  };

  var getArray = function() {
  //public SmArray getArray() {
    let next = nextItem(); //byte[]
    if(next === null) return null;
    return new SmArray(next);
  };

  /**assumes that the next item is an omap else throws error*/
  var getOmap = function() {
  //public SmOmap getOmap() {
    let next = nextItem(); //byte[] next = nextItem();
    if(next === null) return null;
    return new SmOmap(next);
  };

  // ------------------
  // Private functions:
  // ------------------
  
  //From Java GuruUtilites:
  /**given a string array of sections*/
  var processEmbeddedOmap = function(sections) {
  //private static void processEmbeddedOmap(ArrayList<String> sections, SmCborBuffer buffer) {
    //handle next section
    let nextSection = sections.shift(); //get the first element (String) in the array
    let msg = nextSection.split("\\+"); //split on pluses  --> string[]
    startOmap(msg[0]); //start a named omap
    if(msg[msg.length-1].endsWith("=")){ //starts an embedded omap
      insertValuesIntoCbor(msg, 1, msg.length-2);
      putString(msg[msg.length-1]); // last key
      //now omap value
      processEmbeddedOmap(sections);
    }
    else {
      //insert key values no embedded omap
      insertValuesIntoCbor(msg, 1, msg.length-1);
    } 
    end(); // end this omap
  };
 

  //From Java GuruUtilities:
  /**Inserts key=value where value can be string or stringArray
   * @param msg:
   * @param start: first index inserted
   * @param end:   last index inserted
   */
  var insertValuesIntoCbor = function(msg, start, end) {
  //private static void insertValuesIntoCbor(String[] msg, int start, int end, SmCborBuffer buffer) {
    for(let i=start; i<=end; i++) {
      let equals = msg[i].indexOf("="); //find first equals sign 
      putString(msg[i].substring(0, equals)); //key
      let value = (msg[i].substring(equals+1, msg[i].length())); //String
      if(value.startsWith("~")){ // array
        let array = value.substring(1).split("~"); //String[]
        startArray();
        for(let j=0; j<array.length; j++) {
          if(array[j].startsWith("`")){// check for back tick
            let bt = array[j].split("`"); //String[]
            startArray();
            for(let k=1; k<bt.length; k++) {
              put(rtalkListString_fromDef(bt[k]));
            }
            end();
          }
          else {
            put(rtalkListString_fromDef(array[j]));
          }
        }
        end();
      }
      else { //just a single string value
        putString(rtalkListString_fromDef(value));
      }
    }
  };
 
  //From Java RtalkListString: 
 	/**Given a def which leads with a % convert these to a RiListString
   * formatted byte[] of (%tag:color:indent string), unused trailing attrs do
   * not need to be included.  tag is required*/
	var rtalkListString_fromDef = function(def) {
    if(!def.startsWith("%")) return def;
    let pos = def.indexOf(" ");  //start of string part
    if(pos < 0) return def;      //not a list string
    let tmpArray = (def.substring(1, pos)).split(":");  //will be:String[] { tag color indent}
    //always a tag, check if formatted as expected
    let tag = 0;
    try { tag = +tmpArray[0];}
    catch(e) { return def; }
    let color = 0;
    let colorSet = 0;
    
    //color set and color 16 colors and 4 sets
    if(tmpArray.length > 1) {
      let colorTmp = +tmpArray[1]; //int
      colorSet = colorTmp >> 4;
      color = colorTmp & 0xf;
    }
    //get the indent
    let indent = 0;
    if(tmpArray.length > 2) indent = +tmpArray[2];

    //combine and return the string (as a js object)
    let rString = {};
    rString.color = color;
    rString.indent = indent;
    rString.font = 0;
    rString.tag = tag;
    rString.action = 0;
    rString.text = def;
    
    return rString;
	};
	  

  
  //From GuruUtilities:
  /**Takes a string which uses the ASCII riri seps of ^ + ~ ` and converts them to a CBOR structure.
   * Expects an omap so first char must be ^
   * Zero length fields are dropped  ^^ ++ ~~ ``
   * Omap is ^name+key=val^name=key=val
   * in k=v v can be strings, listStrings %.. , arrays ~..~.. or omaps =^....^ must have trailing ^
   * in k=v v cannot be empty
   * Omap as a value   ^name1+key1=^name+k=v+k=v^+key1=val^name2+key2=val...
   * ` allows arrays within arrays only ~` ` `~ etc where elements are strings or list strings
   * 
   * @param riri
   * @param buffer
   */
  var insertRiri = function(riri) {
  //public static void insertRiri(String riri, SmCborBuffer buffer) {
    if(riri.charCodeAt(0) != '^') return; //omaps start with ^
    let sections = riri.substring(1).split("\\^"); //String[]
    let continuation = false; //boolean
    while(!sections.isEmpty()){ //here is always the start of a new omap or continuation
      let nextSection = sections.shift(); //pop the first item
      let msg = nextSection.split("\\+"); //String[]
      if(continuation){
        if(msg[msg.length-1].endsWith("=")){ //starts an embedded omap
          insertValuesIntoCbor(msg, 1, msg.length-2);
          putString(msg[msg.length-1].substring(0, (msg[msg.length-1]).length()-1)); // insert the key
          //now omap value
          processEmbeddedOmap(sections);
        }
        else {
          // insert key values no embedded omap
          insertValuesIntoCbor(msg, 1, msg.length-1);
          end();
          continuation = false;
        }
      }
      else {
        startOmap(msg[0]); //start a named omap
        if(msg[msg.length - 1].endsWith("=")) { //starts an embedded omap
          insertValuesIntoCbor(msg, 1, msg.length-2);
          putString(msg[msg.length-1].substring(0, (msg[msg.length-1]).length()-1)); //insert the key
          //now omap value
          processEmbeddedOmap(sections);
          continuation = true;
          if(sections.isEmpty())
            end();
        }
        else {
          // insert key values no embedded omap
          insertValuesIntoCbor(msg, 1, msg.length-1);
          continuation = false;
          end();
        }
      }
    }
  };

  /**local function.
   * Given an Arraybuffer containing bytes, converts them to a javascript number*/
  var convertByteArrayToNumber = function(byteBuffer, index) {
    let data = new ArrayBuffer(byteBuffer, index, 8);
    let view = new DataView(data, index, 8); //create a data view of it
    //set as LITTLE_ENDIAN //TODO?
    data.forEach(function (b, i) { //set bytes
        view.setUint8(i, b);
    });
    let num = view.getFloat32(0); //read the bits as a float. Doing this implicitly converts from a 32-bit float into JavaScript's native 64-bit double
    return num;
  };
  
 
  /*---------------
   *closure return:
   *---------------*/
  return {
    
    //Public API (list functions here to make them publicly available):
    //-----------------------------------------------------------------
    clear: clear,
    setCursor:setCursor,
    dropToCursor:dropToCursor,
    setContentsSize:setContentsSize,
    getCursor:getCursor,
    backupOverEnd:backupOverEnd,
    rewind:rewind,
    size:size,
    atEnd:atEnd,
    isEmpty:isEmpty,
    stringToBytes:stringToBytes,
    bytesToString:bytesToString,
    nextCborSize:nextCborSize,
    writeCborSize:writeCborSize,
    type:type,
    skip:skip,
    skipArrayStart:skipArrayStart,
    nextItem:nextItem,
    startArray:startArray,
    atArrayEnd:atArrayEnd,
    startOmap:startOmap,
    end:end,
    //searchFor:searchFor,
    
    append:append,
    appendByteArray:appendByteArray,
    //put:put,
    putTag:putTag,
    putString:putString,
    putSmUri:putSmUri,
    putKeyVal:putKeyVal,
    putStringArray:putStringArray,
    putMap:putMap,
    putLong:putLong,
    putDouble:putDouble,
    putDoubleArray:putDoubleArray,
    putByteArray:putByteArray,
    putBool:putBool,
    putNull:putNull,
    putSmOmap:putSmOmap,
    putOmapFromRiri:putOmapFromRiri,
    putSmArray:putSmArray,
    
    getBytes:getBytes,
    getObject:getObject,
    getBuffer:getBuffer,
    toBytes:toBytes,
    getString:getString,
    eraseString:eraseString,
    getLong:getLong,
    getTag:getTag,
    getUri:getUri,
    getDoubleArray:getDoubleArray,
    getDouble:getDouble,
    getByteArray:getByteArray,
    getBoolean:getBoolean,
    getArray:getArray,
    getOmap:getOmap

  }; //closure return
  
}()); //namespace smCbor
