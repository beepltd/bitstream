export default class BitStream {
  _stream : Array<number> = [];
  _bitLength : number = 0;
  _cursor : number = 0;

  constructor(stream : Array<number>=null) {
    if (stream !== null) {
      this._stream = stream;
      this._bitLength = this._stream.length * 8;
    }
  }

  getCursor() : number {
    return this._cursor;
  }

  getLength() : number {
    return this._bitLength;
  }

  getStream() : Array<number> {
    return this._stream;
  }
  resetCursor() {
    this._cursor=0;
  }

  write(input : number, {bytes = 0, bits = 0} : {bytes? : number, bits? : number}) {
    var len = (bytes * 8) + bits;
    var all = Math.pow(2, len) - 1;
    input = input & all;
    var thisByte = Math.floor(this._bitLength / 8);
    var thisBit = this._bitLength % 8;
    while (len > 0) {
      var thisLen = Math.min(len, 8 - thisBit);
      this._stream.length = thisByte + 1;
      if (this._stream[thisByte] == null) {
        this._stream[thisByte] = 0;
      }
      var shiftAmt = (8 - (thisBit + len));
      this._stream[thisByte] = this._stream[thisByte] | (shiftAmt > 0 ? (input << shiftAmt) : (input >> (0 - shiftAmt)));
      this._stream[thisByte] = 255 & this._stream[thisByte];
      len -= thisLen;
      this._bitLength += thisLen;
      thisBit = 0;
      thisByte++;
    }
  }

  writeBool(input : boolean) {
    this.write((input ? 1 : 0), {bits: 1});
  }

  writeBytes(input : Array<number>, {bytes = 0, bits = 0} : {bytes? : number, bits? : number}) {
    var len = (bytes * 8) + bits;
    var totBytes = Math.floor(len / 8);
    var remBits = len % 8;

    var numBytes = input.length;
    if (remBits > 0) {
      var firstByte = (numBytes - totBytes) - 1;
      this.write(input[firstByte], {bits: remBits});
    }
    for (var x = numBytes - totBytes; x < numBytes; x++) {
      this.write(input[x], {bytes: 1});
    }
  }

  output() {
    console.log(this.toString());
  }


  toString() : string {
    var str = "";
    for (var b in this._stream) {
      str += (parseInt(b) >>> 0).toString(2).padStart(8, "0");
    }
    return str;
  }

  read({bytes = 0, bits = 0} : {bytes? : number, bits? : number}) : number {
    var len = (bytes * 8) + bits;
    var thisByte = Math.floor(this._cursor / 8);
    var thisBit = this._cursor % 8;
    var output = 0;
    while (len > 0) {
      var thisLen = Math.min(len, 8 - thisBit);
      var all = Math.pow(2, thisLen) - 1;
      var bit = this._stream[thisByte];
      if (thisBit + thisLen < 8) {
        bit = bit >> (8 - (thisBit + thisLen));
      }
      output = output << thisLen | (bit & all);
      len -= thisLen;
      this._cursor += thisLen;
      thisBit = 0;
      thisByte++;
    }
    return output;
  }

  readBool() : boolean {
    return this.read({bits: 1}) == 1;
  }

  readAsciiString({bytes = 0, bits = 0} : {bytes? : number, bits? : number}) : string {
    var b=this.readBytes({bytes: bytes, bits: bits});
    var op="";
    for(var i in b) {
      op+=String.fromCharCode(parseInt(i));
    }

    return op;
    
  }

  writeAsciiString(input : string,{bytes = 0, bits = 0} : {bytes? : number, bits? : number}) {
    var op=[];
    for(var i=0;i<input.length;i++) {
      op.push(input.charCodeAt(i));
    }
    this.writeBytes(op,{bytes: bytes, bits: bits});
  }

  readHexString({bytes = 0, bits = 0} : {bytes? : number, bits? : number}) : string {
    var b=this.readBytes({bytes: bytes, bits: bits});
    var op="";
    for(var i in b) {
      op+=parseInt(i).toString(16);
    }
    return op;
  }

  writeHexString(input : string,{bytes = 0, bits = 0} : {bytes? : number, bits? : number}) {
    var op=[];
    for(var i=0;i<(input.length/2);i++) {
      op.push(parseInt(input[i],16));
    }
    this.writeBytes(op,{bytes: bytes, bits: bits});
  }

  checkBit(bit : number) : boolean {
    var b=(this._bitLength-bit)-1;
    var thisByte = Math.floor(b / 8);
    var thisBit = b % 8;
    return (this._stream[thisByte] & (1 << (7-thisBit))) != 0;
  }

  readBytes({bytes = 0, bits = 0} : {bytes? : number, bits? : number}) : Array<number> {
    var len = (bytes * 8) + bits;
    var totBytes = Math.floor(len / 8);
    var remBits = len % 8;
    var op : Array<number> = [];
    if (remBits > 0) {
      op.push(this.read({bits: remBits}));
    }
    for (var i = 0; i < totBytes; i++) {
      op.push(this.read({bytes: 1}));
    }
    return op;
  }

  readBitStream({bytes = 0, bits = 0} : {bytes? : number, bits? : number}) : BitStream {
    var op=new BitStream();
    op.writeBytes(this.readBytes({bytes: bytes, bits: bits}),{bytes: bytes, bits: bits});
    return op;
  }

  writeBitStream(input : BitStream, {bytes = 0, bits = 0} : {bytes? : number, bits? : number}) {
    this.writeBytes(input.readBytes({bytes: bytes, bits: bits}),{bytes: bytes, bits: bits});
  }

}
