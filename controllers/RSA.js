//-----------------------------------------------------------------------------
//constructor: RSA
var RSA = function () {
	this.bigInt = require('big-integer');
	//property: kunci {kunciPrivat, kunciPublik} //pasangan kunci publik dan kunci privat//
	this.kunci = {
		kunciPublik: null,
		kunciPrivat: null
	};

	//method: pilihPQ
	//input: int panjang_n //byte length//
	//output: bigInt[4] ret //array berisi p, q, phi_n, e//
	this.pilihPQ = function (panjang_n) {
		var ujiKriteria = false;
		var ret = [];
		var p = this.bigInt();
		var q = this.bigInt();
		var phi_n = this.bigInt();
		var n = this.bigInt();
		var e = this.bigInt();
		var min = this.bigInt(2).pow(panjang_n/2);
		var max = this.bigInt(2).pow(panjang_n/2 + 1);		
		
		while (ujiKriteria === false) {
			p = this.bigInt.randBetween(min, max);
			q = this.bigInt.randBetween(min, max);
			//jika p dan q bukan bilangan prima
			if (!(p.isPrime()) || !(q.isPrime())) { 
				continue;
			}

			p_minus_1 = p.subtract(this.bigInt.one);
			q_minus_1 = q.subtract(this.bigInt.one);

			phi_n = p_minus_1.multiply(q_minus_1); //phi_n = (p-1)(q-1)
			e = this.bigInt.randBetween(0, phi_n); //dicari e pada Z_phi_n
			gcd = this.bigInt.gcd(phi_n, e); 

			 //jika gcd(phi_n, e) =/= 1
			if (gcd.compareTo(this.bigInt.one) !== 0){
				continue;
			}

			ujiKriteria = true;
		}

		ret.push(p);
		ret.push(q);
		ret.push(phi_n);
		ret.push(e);

		return ret;
	}

	//method: inversPerkalian //extended euclid algorithm//
	//input: bigInt m, b dimana m > b
	//output: bigInt B2 //invers perkalian b terhadap Z_m, gcd(m,b) = 1, gcd(m, B2) = 1 //
	this.inversPerkalian = function (e, phi_n) {
		var A = phi_n;
		var B = e;
		var q = this.bigInt();
		var r = this.bigInt();
		var S1 = this.bigInt.one;
		var S2 = this.bigInt.zero;
		var S = this.bigInt();
		var T1 = this.bigInt.zero;
		var T2 = this.bigInt.one;
		var T = this.bigInt();
		var invers = this.bigInt();

		while (B.compareTo(this.bigInt.zero) !== 0){
			res = A.divmod(B);
			q = res.quotient;
			r = res.remainder;

			A = B;
			B = r;

			S = S1.subtract(q.multiply(S2));
			S1 = S2;
			S2 = S;

			T = T1.subtract(q.multiply(T2));
			T1 = T2;
			T2 = T;
		}

		invers = T1.mod(phi_n);

		return invers;
	}
}

//method: getKunciPublik
//mengembalikan value kunciPublik dari obj kunci
RSA.prototype.getKunciPublik = function () {
	return this.kunci['kunciPublik'];
}

//method: getKunciPrivat
//mengembalikan value kunciPrivat dari obj kunci
RSA.prototype.getKunciPrivat = function () {
	return this.kunci['kunciPrivat'];
}

//method: setKunciPublik
//inisialisasi kunci publik dengan masukan n dan e
RSA.prototype.setKunciPublik = function (n, e) {
	this.kunci['kunciPublik'] = new KunciPublikRSA(this.bigInt(n), this.bigInt(e));
	return this.kunci['kunciPublik'];
}

//method: setKunciPrivat
//inisialisasi kunci privat dengan masukan d
RSA.prototype.setKunciPrivat = function (d) {
	this.kunci['kunciPrivat'] = new KunciPrivatRSA(this.bigInt(d));
	return this.kunci['kunciPrivat'];
}

//method: pembangkitKunci
//input: int panjang_n //byte length//
//output: obj kunci //pasangan kunci publik dan kunci privat//
RSA.prototype.pembangkitKunci = function (panjang_n) {
	do {
		var pq = [];
		pq = this.pilihPQ(panjang_n);
		edmodphi_n = pq[3].multiply(this.inversPerkalian(pq[3], pq[2])).mod(pq[2]);
	} while(edmodphi_n.compareTo(this.bigInt.one) !== 0);

	p = pq[0];
	q = pq[1];
	phi_n = pq[2];
	e = pq[3];
	n = p.multiply(q);
	d = this.inversPerkalian(e, phi_n);

	kunciPublik = new KunciPublikRSA(n, e);
	this.kunci['kunciPublik'] = kunciPublik;
	kunciPrivat = new KunciPrivatRSA(d);
	this.kunci['kunciPrivat'] = kunciPrivat;
	return this.kunci;
}

//fungsi enkripsi
//input: hex plaintext, obj kunciPublik(n, e)
//output: hex ciphertext
RSA.prototype.enkripsi = function (plaintext, kunciPublik) {
	var bigP = this.bigInt(plaintext, 16);
	bigE = this.bigInt(kunciPublik.getE());
	bigN = this.bigInt(kunciPublik.getN());
	bigP = bigP.modPow(bigE, bigN);
	return bigP.toString(16);
}

//fungsi dekripsi
//input hex ciphertext, obj kunciPrivat(d) , obj kunciPublik(n, e)
//output hex plaintext
RSA.prototype.dekripsi = function (ciphertext, kunciPrivat, kunciPublik) {
	var bigC = this.bigInt(ciphertext, 16);
	bigD = this.bigInt(kunciPrivat.getD());
	bigN = this.bigInt(kunciPublik.getN());
	bigC = bigC.modPow(bigD, bigN);
	return bigC.toString(16);
}
//end of constructor: RSA
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//constructor: KunciPublicRSA
function KunciPublikRSA (n, e) {
	this.n = n;
	this.e = e;

	this.getN = function () {
		return this.n.toString();
	}

	this.getE = function () {
		return this.e.toString();
	}
}
//end of constructor: KunciPublicRSA
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
//constructor: KunciPrivatRSA
function KunciPrivatRSA (d) {
	this.d = d;

	this.getD = function () {
		return this.d.toString();
	}
}
//end of constructor: KunciPrivatRSA
//-----------------------------------------------------------------------------
module.exports = RSA;