'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var mongoose = require('mongoose');
var Message = require('../models/message');

var ChatCtrl = require('../controllers/ChatCtrl');

/**
 * Globals
 */
var kunci_publik_n_server = '14371343929626017999139431136838112768087843761251991417949';
var kunci_publik_e_server = '5471737747308237468435381722180996820505264772202975279371';
var kunci_privat_d_server = '1659753657407600073244968390781770611643473805307669044131';
var keyIV_server = '207a5181f3496b208a94ec839dc98228d7f94c9dc0135daf';
var pubKey_client = {
	n: '9610875834524471422805113708035664269295813804519866882403',
	e: '994905980336380792392933204324279679265173952024192943631'
}
var pvtKey_client = '4664472374725815000954912573051761747870723974404896186447';
var keyIV_client = '005db5904c3c516ffa983472c9f6fdedf79423778e8e98f4';

var sender = '55839c7794eb4ee41a4b66a1_admin';
var receiver = '55839c7794eb4ee41a4b669d_visitor';

var msg = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut congue vitae quam non fringilla.';



var chatController = new ChatCtrl(Message);

var dbURI     = 'mongodb://localhost:27017/testDB';
var mongoose  = require('mongoose');

/**
 * Unit tests
 */
describe('WidgetCtrl controller Unit Tests:', function() {
	/*before(function (done) {
    mongoose.connect(dbURI, function (err) {
      if (err) {
        throw err;
      }
      done();
    });
	});*/

	describe('Method crypt:', function () {
		it('should return same message after crypt and decrypt', function (done) {
			var crypted_msg = chatController.crypt(msg, keyIV_server);
			var decrypted_msg = chatController.crypt(crypted_msg, keyIV_server);
			decrypted_msg.should.be.equal(msg);
			//done(console.log(msg + '\n' + crypted_msg + '\n' + decrypted_msg));
			done();
		})
	})

	describe('Method encryptKeyIV decryptKeyIV:', function () {
		it('should return same keyIV server after decrypt using pvtKey client', function (done) {
			var crypted_keyIV = chatController.encryptKeyIV(keyIV_server, pubKey_client);
			var decrypted_keyIV = chatController.decryptKeyIV(crypted_keyIV, pubKey_client.n, pubKey_client.e, pvtKey_client);
			decrypted_keyIV.should.be.equal(keyIV_server);
			//done(console.log(keyIV_server + '\n' + crypted_keyIV + '\n' + decrypted_keyIV));
			done();
		})

		it('should return same keyIV client after decrypt using pvtKey server', function (done) {
			var pubKey_server = {
				n: kunci_publik_n_server,
				e: kunci_publik_e_server
			}
			var crypted_keyIV = chatController.encryptKeyIV(keyIV_client, pubKey_server);
			var decrypted_keyIV = chatController.decryptKeyIV(crypted_keyIV, kunci_publik_n_server, kunci_publik_e_server, kunci_privat_d_server);
			decrypted_keyIV.should.be.equal(keyIV_client);
			//done(console.log(keyIV_client + '\n' + crypted_keyIV + '\n' + decrypted_keyIV));
			done();
		})
	})

	describe('Method saveMsg:', function () {
		it('should save message without error', function (done) {
			chatController.saveMsg(msg, sender, receiver, function (err, msg) {
				should.not.exist(err);
				//done(console.log(msg));
				done();
			})
		})

		it('should save second message without error', function (done) {
			chatController.saveMsg(msg, receiver, sender, function (err, msg) {
				should.not.exist(err);
				//done(console.log(msg));
				done();
			})
		})

		it('should save third message without error', function (done) {
			chatController.saveMsg(msg, receiver, 'test', function (err, msg) {
				should.not.exist(err);
				//done(console.log(msg));
				done();
			})
		})

	})

	describe('Method getUnreadMsg:', function () {
		it('should return msg object which have no timeReceive', function (done) {
			chatController.getUnreadMsg(sender, receiver, function (err, arrId) {
				should.not.exist(err);
				//done(console.log(arrId));
				done();
			})
		})
	})

	describe('Method readMsg:', function () {
		it('should update timeReceive without error', function (done) {
			chatController.readMsg(sender, receiver, function (err, numAffected) {
				should.not.exist(err);
				numAffected.nModified.should.be.equal(2);
				//done(console.log(numAffected));
				done();
			})
		})

		it('should return just unread message', function (done) {
			chatController.getUnreadMsg(sender, receiver, function (err, arrId) {
				should.not.exist(err);
				//done(console.log(arrId));
				done();
			});
		});

		it('should show all message', function (done) {
			Message.find({}, 'sender receiver timeSent timeReceive', function (err, msg) {
				//done(console.log(msg));
				done();
			})
		})
	});

	after(function (done) {
	  Message.remove({}).exec();
	  //mongoose.connection.close();
	  done();
	});

});