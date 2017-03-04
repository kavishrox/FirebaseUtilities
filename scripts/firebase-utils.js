var Firebase = require('firebase');
var SantiyCheck = require('./sanity-checker');
var util = require("util");
var EventEmitter = require('events').EventEmitter;

var config, firebaseUrls;

var firebases = {};

module.exports = FirebaseUtils;

function parseConfig(conf) {
  config = conf.config;
}

function initFirebases() {
  firebaseUrls = config["FIREBASE_URLS"];
  for(var fbName in firebaseUrls) {
    firebases[fbName] = new Firebase(firebaseUrls[fbName]);
  }
}

function FirebaseUtils(conf) {
  parseConfig(conf);
  initFirebases();
  EventEmitter.call(this);
}

util.inherits(LiveSurgeMonitorer, EventEmitter);

FirebaseUtils.prototype.getFirebaseList = function(options) {
  var firebaseList = {};
  for(var fbName in fbNames) {
    if(firebases[fbName]) {
      firebaseList[fbName] = firebases[fbName];
    }
  }
  return firebaseList;
};

FirebaseUtils.prototype.set = function(options) {
  var path = options.path;
  var base = options.base;
  var data = options.data;
  var metaData = options.metaData;
  return new Promise(function(resolve ,reject) {
    if(!SantiyCheck.sanityCheck(data)) {
      reject({
        code : "500",
        error: "Data contains undefined",
        metaData: metaData
      });
    } else {
      firebases[base].child(path).set(data, function(error) {
        if(error != null) {
          reject({
            code : "500",
            error: "Firebase set failed",
            metaData: metaData
          });
        } else {
          resolve({
            code : "200",
            message: "Successfully set on firebase",
            metaData: metaData
          });
        }
      });
    }
  });
};

FirebaseUtils.prototype.updateMultiwrite = function(options) {
  var base = options.base;
  var multiWriteList = options.multiWriteList;
  var metaData = options.metaData;
  return new Promise(function(resolve, reject) {
    firebases[base].update(multiWriteList, function(error) {
      if(error != null) {
        reject({
          code : "500",
          error: "Firebase multiwrite failed",
          metaData: metaData
        });
      } else {
        resolve({
          code : "500",
          message: "Firebase multiwrite succeeded",
          metaData: metaData
        });
      }
    });
  });
};

//check for empty path too and metaadata
FirebaseUtils.prototype.update = function(options) {
  var path = options.path;
  var base = options.base;
  var data = options.data;
  var metaData = options.metaData;
  return new Promise(function(resolve ,reject) {
    if(!SantiyCheck.sanityCheck(data)) {
      reject({
        code : "500",
        error: "Data contains undefined --- node",
        metaData: metaData
      });
    } else {
      firebases[base].child(path).update(data, function(error) {
        if(error != null) {
          reject({
            code : "500",
            error: "Firebase update failed",
            metaData: metaData
          });
        } else {
          resolve({
            code : "200",
            message: "Successfully set on firebase",
            metaData: metaData
          });
        }
      });
    }
  });
};

FirebaseUtils.prototype.fetch = function(options) {
  var path = options.path;
  var base = options.base;
  var metaData = options.metaData;
  return new Promise(function(resolve, reject) {
    firebases[base].child(path).once("value", function(snapData) {
      if(snapData.val() != null) {
        resolve({
          code : "200",
          message: "Fetched data successfully",
          data: snapData.val(),
          metaData: options.metaData
        });
      } else {
        logger.error("Null value received for this path");
        reject({
          code : "500",
          error: "No value present",
          metaData: options.metaData
        });
      }
    });
  });
};

FirebaseUtils.prototype.push = function(options) {
  var base = options.base;
  var path = options.path;
  var data = options.data;
  firebases[base].child(path).push(data);
};

FirebaseUtils.prototype.notifyOnChange = function(options) {
  var base = options.base;
  var path = options.path;
  var self = this;
  firebases[base].child(path).on("value", function(snapShot) {
    if(snapShot.val() !== null) {
      self.emit("change", {
        data: snapShot.val()
      })
    } else {
      self.emit("removed", {});
    }
  });
};
