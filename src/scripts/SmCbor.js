import { isArray, isObject } from "util";

/* eslint-disable no-unused-vars */
/*jslint bitwise: true, browser: true, continue: true, devel: true, indent: 4, maxerr: 50, plusplus: true, vars: true, white: true, windows: false */ //for jslint
/*globals */ //for jslint

/**CBOR class based on the Java class SmCborBuffer (in rtalk.sm)
 * Original Java description:
 *     System Message (SM) for remote UI using RIRI strings
 *     Limited CBOR conversion buffer for use with MQTT messages
 *     Collections can be unbounded Arrays<CBOR> or Omaps<String,CBOR> (fixed size not supported)
 *     Primitives are Strings, byte[], Double, Long, boolean, null
 *     Strings are limited to single byte utf8
 *     @author markroos
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
    curpos = 0,  //points at next spot to write
    maxCur = 0   //max cursor location during a rewind() call
    ;

  // ------------------
  // Private functions:
  // ------------------

  /**Low level append a byte to this buffer*/
  var append = function (b) {
    buf.push(b);
    curpos++;
  };

  /**Low level append of a byte array to this buffer*/
  var appendByteArray = function (data) {
    for (let i = 0; i < data.length; i++)
      append(data[i]);
  };

  /**Returns true if have hit the array end marker*/
  var atArrayEnd = function () {
    return buf[curpos] === 0xff;
  };

  /**Returns true if no more bytes to process*/
  var atEnd = function () {
    if (buf.length === 0) return true;
    if (curpos >= buf.length) return true;
    if (maxCur !== 0 && curpos >= maxCur) return true;
    return false;
  };

  /**Moves the cursor one towards the start from the end
   * used to backup over an omap or array end when the last one
   * in the buffer is the focus*/
  var backupOverEnd = function () {
    if (maxCur > curpos) curpos = maxCur;
    curpos--;
  };

  /**Converts byte[] of ASCII byte to a string*/
  var bytesToString = function (bytes) {
    let cnt = bytes.length;
    let rtn = ""; //String rtn = (new String(bytes, "ISO-8859-1"));
    for (let i = 0; i < cnt; i++)
      rtn += String.fromCharCode(bytes[i]);
    return rtn;
  };

  /**Drops the leading bytes up to the current cursor location
   * Used to drop messages already processed*/
  var dropToCursor = function () {
    buf = buf.slice(curpos, buf.length); //Arrays.copyOfRange(buf, curpos, buf.length);
    maxCur = buf.length;
    curpos = 0;
  };

  /**Write the end byte for an unbounded collection*/
  var end = function () {
    append(0xff);
  };

  /**Called when the next item is an Array (else throws an error)*/
  var getArray = function () {
    let rtn = [];
    while (!atArrayEnd()) {
      rtn.push(getNext()); //QUES: Should this be a recursive expand? any special features in the returned object? ANSW:Yes,No
    }
    return rtn;
  };

  /**Low level function, returns the requested number of bytes starting at curPos. advances curPos
     Note: also see nextItemBytes() which returns the complete bytes for the next item, whatever it may be*/
  var getBytes = function (len) {
    let rtn = buf.slice(curpos, curpos + len); //byte[] rtn = Arrays.copyOfRange(buf, curpos, curpos + len);
    curpos = curpos + len;
    return rtn;
  };

  /**Called when the next item is an omap (else throws error)*/
  var getOmap = function () {
    let next = nextItemBytes(); //byte[] next = nextItem();
    if (next === null) return null;

    //Return omap as { Tagged: [{attributes}, key, val, ...] }
    //where each val can be a string, key/val list[], or omap {}
    let val = [];
    let attribs = {
      //tag: getNext(),   //Would be the CBOR Tag, ignored  
      value: getNext(),   //first thing in an omap is the name, so fetch that
      //err: ""           //not sure if this field is required unless there is an error
    };
    val.push(attribs);
    while (!atArrayEnd()) {
      val.push(getNext()); //QUES: recursive expansion? ANSW: Yes
    }

    let ret = { Tagged: val }; //wrapper the array
    return ret;
  };

  /**Expects next value to be a string or a bytes[] which is ASCII 
   * and returns a string.  Returns null if not a string
   * if its a null drops the null*/
  var getString = function () {
    if (curpos >= buf.length) return null;
    let tag = buf[curpos]; //byte
    if (tag === 0xf6) {
      curpos = curpos + 1;
      return null;
    }
    tag = (0xe0 & tag);
    if (!((tag === 0x60) || (tag === 0x40))) {
      return null; // string or byte
    }
    let size = nextCborSize();
    return bytesToString(getBytes(size));
  };

  /**Returns. as a long, the next cbor data item tag*/
  var getTag = function () {
    if (curpos >= buf.length) return 0;    //this is really an error
    let tag = buf[curpos]; //byte
    if ((tag & 0xe0) === 0xc0)
      return nextCborSize();
    return (0);    //this is really an error
  };

  /**Computes the CBOR size of the next element (this == value for int data items)
   * Limited to 63 bits, positive int
   * Advances the cursor
   * */
  var nextCborSize = function () {
    let tag = buf[curpos++] & 0x1f;
    if (tag < 24) return tag;
    let cnt = 0;
    switch (tag) {
      case 24: cnt = 1; break;
      case 25: cnt = 2; break;
      case 26: cnt = 4; break;
      case 27: cnt = 8; break;
    }
    let tmp = 0;
    for (let i = 0; i < cnt; i++) {
      tmp = tmp << 8;
      tmp = tmp + (buf[curpos++] & 0xff);
    }
    return tmp;
  };

  /**Low level, returns byte[], the complete set of bytes for the next item, whatever it may be.
   * Also see getBytes(len) which simply returns the indicated number of bytes*/
  var nextItemBytes = function () {
    if (atEnd()) return null;
    let start = curpos; //int
    skip(); //skip forward to the end of the next item (updates curpos)
    return buf.slice(start, curpos); //Arrays.copyOfRange(buf, start, curpos);
  };

  /**Writes a tag type, given an interger tag value*/
  var putTag = function (tag) {
    writeCborSize(0xc0, tag);
  };

  /**Sets to the size of the valid space in the contents byte[]*/
  var setContentsSize = function (pos) {
    maxCur = pos;
  };

  /**Sets the index value of the current low level cursor position*/
  var setCursor = function (pos) {
    let rtn = curpos;
    curpos = pos;
    return rtn;
  };

  /**Returns size of the buffer
   * truncates to the larger of curpos or maxCur*/
  var size = function () {
    let max = maxCur;
    if (curpos > maxCur) {
      max = curpos;
    }
    return max;
  };

  /**Skips all elements inside this collection. Sets cursor to next item
   * initial level must be 0.  Returns true if finished*/
  var skip = function () {
    if (buf[curpos] === 0x9f) {
      curpos++;
      while (!atEnd() && buf[curpos] !== 0xff)
        skip();
      curpos++;
    }
    else {
      let tag = buf[curpos]; //byte
      let skipSize = 0; //int
      if (tag === 0xff) return;
      if ((tag & 0xe0) === 0x40) {
        skipSize = nextCborSize();  // bytes
        curpos = curpos + skipSize;
      }
      if ((tag & 0xe0) === 0x60) {
        skipSize = nextCborSize();  // string
        curpos = curpos + skipSize;
      }
      if ((tag & 0xe0) === 0x00) nextCborSize();  // long
      if ((tag & 0xe0) === 0x20) nextCborSize();  // long
      if (tag === 0xfb) curpos = curpos + 9; // float 8 bytes
      if ((tag & 0xe0) === 0xc0) {
        let tagValue = nextCborSize();  //long
        if (tagValue === 32) {  // look ofr URI
          skip();             // skip the string
          return;
        }
      }
      if (tag === 0xf6) curpos++;  //null
      if (tag === 0xf5) curpos++; // true
      if (tag === 0xf4) curpos++; // false
    }
  };

  /** */
  var skipArrayStart = function () {
    curpos++;
  };

  /**Starts an unbounded array*/
  var startArray = function () {
    append(0x9f);
  };

  /**Starts an unbounded ordered map of name
   * if name is null or empty string then is a nameless omap
   * which is equivalent to a map*/
  var startOmap = function (name) {
    append(0x9f);
    append(0xd3);  // omap tag
    if (name === null || name.isEmpty()) {
      putNull();
    }
    else {
      putString(name);     // tag
    }
  };

  /**Converts string to byte array*/
  var stringToBytes = function (astring) {
    let rtn = [];  //byte[] rtn = astring.getBytes("ISO-8859-1");
    for (let i = 0; i < astring.length; i++)
      rtn.push(astring.charCodeAt(i));
    return rtn;
  };

  /**Returns this buffer as a byte array
   * truncates to the larger of curpos or maxCur*/
  var toBytes = function () {
    //public byte[] toBytes() {
    let max = maxCur;
    if (curpos > maxCur) {
      max = curpos;
    }
    if (max === buf.length) return buf;
    return buf.slice(0, max); //Arrays.copyOfRange(buf, 0, max);
  };

  /**Peeks the next byte and returns a string for the type:
   * e.g. end, empty, Bytes, String, Integer, Omap, Array, Uri, Tag, Float, Null, Boolean
   * */
  var type = function () {
    if (atEnd()) return "end";
    if (isEmpty()) return "empty";
    let tag = buf[curpos]; //byte
    switch (tag & 0xe0) {
      case 0x40: return "Bytes";
      case 0x60: return "String";
      case 0x00: return "Integer";
      case 0x20: return "Integer";
      case 0xc0: {
        let tagValue = nextCborSize(); //long
        if (tagValue === 32) {  //look for URI
          skip();              //skip the string
          return "Uri";
        }
        return "Tag";
      }
    }
    switch (tag) {
      case 0x9f:  //indefinite Array
        if (buf[curpos + 1] === 0xd3) //omap tag
          return "Omap";
        return "Array";
      case 0xfb: return "Float";
      case 0xf6: return "Null";
      case 0xf5: return "Boolean"; // true
      case 0xf4: return "Boolean"; // false
    }
    return "unknown";
  };

  /**Writes cbor size entry. Note: extended to allow up to 63 bits (positive int)
   * Given arguments of int type, long size*/
  var writeCborSize = function (type, size) {
    if (size < 24) {
      append((type + size) & 0xff);
      return;
    }
    if (size < 256) {
      append((type + 24) & 0xff);
      append(size & 0xff);
      return;
    }
    if (size < 65536) {
      append((type + 25) & 0xff);
      append((size >> 8) & 0xff);
      append((size & 0xff));
      return;
    }
    if (size < 4254967296) {
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

  // ------------------
  // Public Functions:
  // ------------------

  /**Clears out the contents of the buffer by reseting pointers*/
  var clear = function () {
    buf = [];
    curpos = 0;
    maxCur = 0;
  };

  /**Expects next value to be a string or a bytes[] which is ASCII 
   * Replaces the bytes with ASCII spaces (0x20)
   * leaves the cursor pointing at the next object
   * @param  pos is the index of the start of the string*/
  var eraseString = function (pos) {
    if (pos >= buf.length) return;
    let tag = buf[pos]; //byte
    tag = (0xe0 & tag);
    if (!((tag === 0x60) || (tag === 0x40))) {
      return; // not a string or byte[]
    }
    curpos = pos;
    let size = nextCborSize();  //int
    for (let i = curpos; i < curpos + size; i++) {
      buf[i] = 0x20;
    }
    return;
  };

  /**Returns the next item*/
  var getNext = function () {
    if (atEnd()) return null;
    let type = type();
    if (type === "String") return getString();
    if (type === "Array") return getArray();
    if (type === "Omap") return getOmap();
    if (type === "Null") {
      curpos++;
      return null;
    }
    return null;
  };

  /**Returns true if there is no content*/
  var isEmpty = function () {
    return (curpos === 0 && maxCur === 0);
  };

  /**Writes out a named map.
   * Note: if name is null then is an unnamed map
   * If map is null then this simply emits a null*/
  var putMap = function (name, map) {
    if (map === null) {
      putNull();
    }
    else {
      startOmap(name);
      for (var key in map) { //map.forEach((k,v)-> put(k,v));
        if (map.hasOwnProperty(key)) {
          putString(key);      //save the key
          putString(map[key]); //save the value
        }
      }
      end();
    }
  };

  /**Writes a null entry*/
  var putNull = function () {
    append(0xf6);
  };

  /**Writes string to an ASCII byte limited utf-8*/
  var putString = function (value) {
    if (value === null) {
      putNull();
      return;
    }
    let size = value.length(); //int
    writeCborSize(0x60, size);
    appendByteArray(stringToBytes(value));
  };

  /**Adds a string array*/
  var putStringArray = function (val) {
    startArray();
    for (let i = 0; i < val.length; i++) {
      putString(val[i]);
    }
    end();
  };

  /**Appends null, array, object or string */
  var encode = function (value) {
    if (value === null) {
      putNull();
    } else if (isArray(value)) {
      startArray();
      for (let i = 0; i < value.length; i++) {
        putString(value[i]);
      }
      end();
    } else if (isObject(value)) {
      putMap(value);
    } else {
      putString(value);
    }
    return;
  };

    /**Decodes in an array */
    var decodeAll = function () {
      var ret = []
      while(!atEnd()) {
        let d = getNext();
        if(d) ret.push(d);
      }
    };

  /**Sets the cursor to the start position, remembers this as maxWrite*/
  var rewind = function () {
    if (curpos > maxCur) maxCur = curpos;
    curpos = 0;
  };

  /**Basic constructor appends CBOR bytes*/
  function SmCbor(bytes) {
    appendByteArray(bytes);
  }

  // ----------------
  // Closure Return:
  // ----------------
  return {

    /*-----------------------------
      Private functions:
      ------------------------------
      append:append,
      appendByteArray:appendByteArray,
      atArrayEnd:atArrayEnd,
      atEnd:atEnd,
      backupOverEnd:backupOverEnd,
      bytesToString:bytesToString,
      dropToCursor:dropToCursor,
      end:end,
      getArray:getArray,
      getBytes:getBytes,
      getOmap:getOmap,
      getString:getString,
      getTag:getTag,
      nextCborSize:nextCborSize,
      nextItemBytes:nextItemBytes,
      putTag:putTag,
      setContentsSize:setContentsSize,
      setCursor:setCursor,
      size:size,
      skip:skip,
      skipArrayStart:skipArrayStart,
      startArray:startArray,
      startOmap:startOmap,
      stringToBytes:stringToBytes,
      toBytes:toBytes,
      type:type,
      writeCborSize:writeCborSize,
    */

    // ---------------------------------
    // Public API:
    //----------------------------------
    clear: clear,
    eraseString: eraseString,
    encode: encode,
    decodeAll: decodeAll,
    getNext: getNext,
    isEmpty: isEmpty,
    putMap: putMap,
    putNull: putNull,
    putString: putString,
    putStringArray: putStringArray,
    rewind: rewind
  }; //closure return

}()); //namespace smCbor

export default smCbor;
