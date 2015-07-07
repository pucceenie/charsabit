//-----------------------------------------------------------------------------
//constructor: Rabbit
var Rabbit = function () {
	//random-js untuk generate hex random
	this.Random = require('random-js');
	//property: keyIV {key, IV} //inisialisasi key dan IV 
	this.keyIV = {
				key: null,
				 IV: null
			};

	//property: internalState {x, c, b} //inisialisasi variabel state, counter, counter carry
	this.internalState = {
					x: [],
					c: [],
					b: 0
				};

	//konstanta KEYSTREAM_LENGTH
	this.KEYSTREAM_LENGTH = 16;

	//konstanta A
	var A = [0x4D34D34D, 
			  0xD34D34D3, 
			  0x34D34D34, 
			  0x4D34D34D, 
			  0xD34D34D3, 
			  0x34D34D34, 
			  0x4D34D34D, 
			  0xD34D34D3];

	//method: bufA
	//convert string konstanta 'A' ke byte buffer
	this.bufA = function () {
		var bufA = [];
		for (var i = 0; i < A.length; i++) {
			bufA[i] = new Buffer(4);
			bufA[i].writeUIntBE(A[i], 0, 4);
		}
		return bufA;
	}

	//method: paddingKey //menambah hex string '0' jika panjang byte hex < panjang byte buffer
	//input: str, buf
	//output: str yang sudah di padding
	this.paddingKey = function (str, buf) {
		for (var i = str.length; i < buf.length*2; i++) {
			str = '0' + str;
		}
		return str;
	}

	//method: XOR //mengembalikan nilai buf1 XOR buf2
	//input: buf1, buf2
	//output: buf1 XOR buf2
	this.XOR = function (buf1, buf2) {
		ln = buf2.length;
		buf = new Buffer(ln);
		buf1.copy(buf, 0, 0, ln);
		for (var i = 0; i < ln; i++) {
			buf[i] ^= buf2[i];
		}
		return buf;
	}

	//method: OR //mengembalikan nilai buf1 OR buf2
	//input: buf1, buf2
	//output: buf1 OR buf2
	this.OR = function (buf1, buf2) {
		ln = buf2.length;
		buf = new Buffer(ln);
		buf1.copy(buf, 0, 0, ln);
		for (var i = 0; i < ln; i++) {
			buf[i] |= buf2[i];
		}
		return buf;
	}

	//method: leftShift //menggeser bit buffer ke kiri sebanyak offset
	//input: buf, offset
	//output: buf << offset
	this.leftShift = function (buf, offset) {
		if (buf.length === 1) return new Buffer([buf[0] << offset]);

		var byteOffset = offset % 8;
		var bufferOffset = (offset - byteOffset) / 8;
		var lastByteChange = 0;

		var ln = buf.length - bufferOffset + 1;
		for (var i = 0; i < ln; i++) {
			buf[i] = ((buf[i + bufferOffset] << byteOffset) | (buf[i + bufferOffset + 1] >>> (8 - byteOffset)));
			lastByteChange = i;
		}

		if (byteOffset === 0) byteOffset = 8;

		buf[lastByteChange + 1] = buf[lastByteChange + 1] >>> byteOffset << byteOffset;

		if (offset > 8) {
			ln = buf.length;
			for (i = lastByteChange + 1; i < ln; i++) {
				buf[i] = 0x00;
			}
		}

		return buf;
	}

	//method: rightShift //menggeser bit buffer ke kanan sebanyak offset
	//input: buf, offset
	//output: buf >>> offset
	this.rightShift = function (buf, offset) {
		if (buf.length === 1) return new Buffer([buf[0] >>> offset]);

		var byteOffset = offset % 8;
		var bufferOffset = (offset - byteOffset) / 8;
		var lastByteChange = buf.length;

		ln = bufferOffset;
		for (var i = buf.length - 1; i > ln; i--) {
			buf[i] = ((buf[i - bufferOffset] >>> byteOffset) | (buf[i - bufferOffset - 1] << (8 - byteOffset)));
			lastByteChange = i;
		}

		buf[lastByteChange - 1] = buf[lastByteChange - bufferOffset - 1] >>> byteOffset;

		if (bufferOffset > 0) {
			for (i = lastByteChange - 2; i >= 0; i--) {
				buf[i] = 0x00;
			}
		}

		return buf;
	}

	//method: rotl //rotation left, menggeser bit buffer ke kiri dan mengisi bit sebelah kanan dengan bit yang tergeser
	//input: buf, offset
	//output: buf <<< offset
	this.rotl = function (buf, offset) {
		var buf2 = new Buffer(buf.length);
		buf.copy(buf2, 0, 0, buf.length);
		buf = this.OR(this.leftShift(buf, offset), this.rightShift(buf2, buf.length * 8 - offset));
		return buf; 
	}

	//method: nextState
	//skema fungsi next state
	this.nextState = function (internalState) {
		var g = [];
		var g_rotl8 = [];
		var g_rotl16 = [];

		//counter update
		for (var j = 0; j < 8; j++) {
			t = (this.internalState['c'][j].readUIntBE(0, 4) + 
				this.bufA()[j].readUIntBE(0, 4) + this.internalState['b']);
			t1 = t % Math.pow(2, 32);

			this.internalState['b'] = (t === t1)
			? 0
			: 1;

			this.internalState['c'][j].writeUIntBE(t1, 0, 4);
		}

		//next state function
		for (var j = 0; j < 8; j++) {
			//count g function
			int_t = this.internalState['x'][j].readUIntBE(0, 4) + this.internalState['c'][j].readUIntBE(0, 4);
			int_t *= int_t;
			buf_t = new Buffer(8);
			buf_t.writeUIntBE(int_t, 0, 8, true);
			buf_t_rotl32 = new Buffer(8);
			buf_t.copy(buf_t_rotl32);
			int_g = this.XOR(buf_t, this.rotl(buf_t_rotl32, 32)).readUIntBE(0, 8) % Math.pow(2, 32);
			g[j] = new Buffer(4);
			g[j].writeUIntBE(int_g, 0, 4);

			//create g_rotl8
			g_rotl8[j] = new Buffer(4);
			g[j].copy(g_rotl8[j]);
			this.rotl(g_rotl8[j], 8);

			//create g_rotl16
			g_rotl16[j] = new Buffer(4);
			g[j].copy(g_rotl16[j]);
			this.rotl(g_rotl16[j], 16);
		}

		//unroll
		int_x = [];

		int_x[0] = g[0].readUIntBE(0, 4) + g_rotl16[7].readUIntBE(0, 4) + g_rotl16[6].readUIntBE(0, 4);
		int_x[1] = g[1].readUIntBE(0, 4) + g_rotl8[0].readUIntBE(0, 4) + g[7].readUIntBE(0, 4);
		int_x[2] = g[2].readUIntBE(0, 4) + g_rotl16[1].readUIntBE(0, 4) + g_rotl16[0].readUIntBE(0, 4);
		int_x[3] = g[3].readUIntBE(0, 4) + g_rotl8[2].readUIntBE(0, 4) + g[1].readUIntBE(0, 4);
		int_x[4] = g[4].readUIntBE(0, 4) + g_rotl16[3].readUIntBE(0, 4) + g_rotl16[2].readUIntBE(0, 4);
		int_x[5] = g[5].readUIntBE(0, 4) + g_rotl8[4].readUIntBE(0, 4) + g[3].readUIntBE(0, 4);
		int_x[6] = g[6].readUIntBE(0, 4) + g_rotl16[5].readUIntBE(0, 4) + g_rotl16[4].readUIntBE(0, 4);
		int_x[7] = g[7].readUIntBE(0, 4) + g_rotl8[6].readUIntBE(0, 4) + g[5].readUIntBE(0, 4);

		for (var j = 0; j < 8; j++) {
			this.internalState['x'][j].writeUIntBE(int_x[j], 0, 4, true);
		}
		return this.internalState;
	}

	//method: keystream
	//skema ekstraksi
	this.keystream = function () {
		var keystream = new Buffer(16);
		var s = [[null, null], [null, null], [null, null], [null, null],
				[null, null], [null, null], [null, null], [null, null]];

		this.nextState(this.internalState);
		x = this.internalState['x'];	

		s[0][0] = new Buffer(2);

		for (var j = 0; j < 8; j++) {
			s[j][0] = new Buffer(2);
			s[j][1] = new Buffer(2);

			x[j].copy(s[j][0], 0, 2, 4);
			x[j].copy(s[j][1], 0, 0, 2);
		}

		this.XOR(s[0][0], s[5][1]).copy(keystream, 0, 0, 2);
		this.XOR(s[0][1], s[3][0]).copy(keystream, 2, 0, 2);
		this.XOR(s[2][0], s[7][1]).copy(keystream, 4, 0, 2);
		this.XOR(s[2][1], s[5][0]).copy(keystream, 6, 0, 2);
		this.XOR(s[4][0], s[1][1]).copy(keystream, 8, 0, 2);
		this.XOR(s[4][1], s[7][0]).copy(keystream, 10, 0, 2);
		this.XOR(s[6][0], s[3][1]).copy(keystream, 12, 0, 2);
		this.XOR(s[6][1], s[1][0]).copy(keystream, 14, 0, 2);

		return keystream;
	}
}

Rabbit.prototype.createKeyIV = function () {
	//generate hex random value, 24 bytes/192 bits total key+IV length
	//var randomHex = this.randomValueHex(48);
	var random = new this.Random();
	var randomHex = random.hex(48, false);
	return randomHex;
}

//method: createKeyIV 
//mengembalikan 48 random hex length untuk key dan IV
Rabbit.prototype.setKeyIV = function (randomHex) {
	var buf = new Buffer(24);
	var key = new Buffer(16);
	var IV = new Buffer(8);

	randomHex = this.paddingKey(randomHex, buf);
	buf.write(randomHex, 'hex');	
	
	buf.copy(key, 0, 0, 16);
	buf.copy(IV, 0, 16, 24);

	this.keyIV['key'] = key;
	this.keyIV['IV'] = IV;

	return this.keyIV;
}

//method: getKey 
//mengembalikan buffer key dari obj keyIV
Rabbit.prototype.getKey = function () {
	return this.keyIV['key'];
}

//method: getIV
//mengembalikan buffer IV dari obj keyIV
Rabbit.prototype.getIV = function () {
	return this.keyIV['IV'];
}

//method: setupKey
//skema persiapan kunci
Rabbit.prototype.setupKey = function (key) {
	var k = [];
	var x = [];
	var c = [];
	var len = 8;
	var sourceStart = 14;
	var sourceEnd = 16;

	//pembagian kunci 128 bit
	for (var i = 0; i < len; i++) {
		k[i] = new Buffer(2);
		key.copy(k[i], 0, sourceStart - 2 * i, sourceEnd - 2 * i);
	}
	//inisialisasi internal state
	for (var j = 0; j < len; j++) {
		this.internalState['x'][j] = new Buffer(4);
		if (j % 2 === 0) {
			this.internalState['x'][j] = Buffer.concat([k[(j + 1) % 8], k[j]]);
		} else {
			this.internalState['x'][j] = Buffer.concat([k[(j + 5) % 8], k[(j + 4) % 8]]);
		}
	}
	//inisialisasi counter
	for (var j = 0; j < len; j++) {
		this.internalState['c'][j] = new Buffer(4);
		if (j % 2 === 0) {
			this.internalState['c'][j] = Buffer.concat([k[(j + 4) % 8], k[(j + 5) % 8]]);
		} else {
			this.internalState['c'][j] = Buffer.concat([k[j], k[(j + 1) % 8]]);
		}
	}
	//iterasi 4x dengan fungsi nextState
	this.nextState(this.internalState);
	this.nextState(this.internalState);
	this.nextState(this.internalState);
	this.nextState(this.internalState);	

	//iterasi counter terakhir
	for (var j = 0; j < len; j++) {
		this.internalState['c'][j] = this.XOR(this.internalState['c'][j], this.internalState['x'][(j + 4) % 8]);
	}

	return this.internalState;	
}

//method: setupIV
//skema pembentukan IV
Rabbit.prototype.setupIV = function (IV) {
	var iv = [];
	var sourceStart = 6;
	var sourceEnd = 8;
	for (var i = 0; i < 4; i++) {
		iv[i] = new Buffer(2);
		IV.copy(iv[i], 0, sourceStart - 2 * i, sourceEnd - 2 * i);
	}

	//update counter
	this.internalState['c'][0] = this.XOR(this.internalState['c'][0], Buffer.concat([iv[1], iv[0]]));
	this.internalState['c'][1] = this.XOR(this.internalState['c'][1], Buffer.concat([iv[3], iv[1]]));
	this.internalState['c'][2] = this.XOR(this.internalState['c'][2], Buffer.concat([iv[3], iv[2]]));
	this.internalState['c'][3] = this.XOR(this.internalState['c'][3], Buffer.concat([iv[2], iv[0]]));
	this.internalState['c'][4] = this.XOR(this.internalState['c'][4], Buffer.concat([iv[1], iv[0]]));
	this.internalState['c'][5] = this.XOR(this.internalState['c'][5], Buffer.concat([iv[3], iv[1]]));
	this.internalState['c'][6] = this.XOR(this.internalState['c'][6], Buffer.concat([iv[3], iv[2]]));
	this.internalState['c'][7] = this.XOR(this.internalState['c'][7], Buffer.concat([iv[2], iv[0]]));

	//iterasi 4x dengan fungsi nextState
	this.nextState(this.internalState);
	this.nextState(this.internalState);
	this.nextState(this.internalState);
	this.nextState(this.internalState);	

	return this.internalState;
}

//method: crypt
//fungsi untuk enkripsi dan dekripsi
Rabbit.prototype.crypt = function (message) {
	var msg_buf = new Buffer(message);
	var result_buf = new Buffer(message.length);
	var index = 0;
	var keyindex = 0;
	var keystream = this.keystream();
	
	for (; index < msg_buf.length; keyindex++, index++) {
		result_buf[index] = msg_buf[index] ^ keystream[keyindex];
		//console.log(keyindex);
		//console.log(keystream);
		if (keyindex === 16) {
			keyindex = 0;
			keystream = this.keystream();
		}
	}
	
	return result_buf.toString('ascii', 0, result_buf.length);
}

//end of constructor: Rabbit
//-----------------------------------------------------------------------------

module.exports = Rabbit;