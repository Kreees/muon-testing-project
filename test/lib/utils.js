var Q = require("q");
var mysql = require('mysql');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var muon;
var mysql_client = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : ''
});
var dbg = true;
var mylog = function(obj){
    if(dbg && obj) return console.log("TESTING MSG: "+obj);
};
var mydbg = function(obj){
    if(dbg && obj){
        console.log("TESTING ERROR: "+obj);
    }
};
var oneDbReset = function(name){
    
    var df = Q.defer();
    mysql_client.query('drop database '+name, function(err) {
        if(err){
            mydbg(err);
        }
        mysql_client.query('create database '+name, function(err) {
            if(err){
                mydbg(err);
                return df.reject(err);
            }
            mylog(" db "+ name + " reset.");
            df.resolve();
        });
    });
    return df.promise;
};

function deleteRecursiveSync(itemPath) {
    if (!fs.existsSync(itemPath)) return;
    if (fs.statSync(itemPath).isDirectory()) {
        _.each(fs.readdirSync(itemPath), function(childItemName) {
            deleteRecursiveSync(path.join(itemPath, childItemName));
        });
        fs.rmdirSync(itemPath);
    } else {
        fs.unlinkSync(itemPath);
    }
};

module.exports = {
    dbg: mydbg,
    log: mylog,
    resetDatabases: function(names){
        var df = Q.defer();
        var p = df.promise;
        mysql_client.connect(function(err, results) {
            if (err) {
                return df.reject(err.message);
            }
            df.resolve();
        });
        _.each(names, function(name){
           p = p.then(function(){
               return oneDbReset(name);
           });
        });
        return p;
    },
    clearHistory: function(cfg) {
        var df = Q.defer();
        fs.exists(cfg.path + '/migrations/history.db', function(exists) {
            if (exists) 
                fs.unlink(cfg.path + '/migrations/history.db', function(err){
                    if(err) return df.reject(err);
                    mylog("clear history: "+cfg.path);
                    df.resolve();
                });
            else df.resolve();
        });
        return df.promise;
            
    },
    resetModels: function(cfg, src){
        var df = Q.defer();
        var dest = cfg.path + '/server/app/models/';
        fs.readdir(dest, function(err, models) {
            if(err)
                return df.reject(err);
            for (var i in models) {
                fs.unlinkSync(dest + models[i]);
            }
            fs.readdir(src, function(err, models) {
                if (err) 
                    return df.reject(err);
                for (var i in models) {
                    fs.writeFileSync(dest + models[i], fs.readFileSync(src + models[i]));
                }
                mylog("models reset: "+models);
                df.resolve();
            });
        });
        return df.promise;
    },
    setMode:function(mode){
        mylog("setMode: " + mode);
        var df = Q.defer();
        if(!muon){
            muon = require('muon');
            muon.ready(function(){
                if(m.cfg.serverMode != mode)
                    m.reload({serverMode: mode}, function() {
                        mylog("loaded mode : "+ m.cfg.serverMode);
                        df.resolve();
                    });
                else df.resolve();
            });
        }else{
            m.reload({serverMode: mode}, function() {
                return df.resolve();
            });
        }
        return df.promise;
    },
    addAndCheckInst: function(name, attrs, done){
        var __ = this;
        var __a = _.clone(attrs);
        this.addInstance(name, attrs).done(function(){
            __.checkInstance(name, __a, done);
        },function(err){
            done(err);
        });
    },
    addInstance: function(name, attrs){
        var df = Q.defer();
        var Model = m.app.models[name];
        if(!Model) return df.reject(err);
        var inst = new Model(attrs);
        inst.save(function(err) {
            if (err) 
                return df.reject(err);
            df.resolve();
        });
        return df.promise;
    },
    checkInstance: function(name, attrs, done) {
        var Model = m.app.models[name];
        if(!Model) return done("model not defined "+ name);
            Model.get(1, function(err, result) {
                if (err)
                    return done(err);
                else {
                    _.each(attrs, function(val, key) {
                        result[key].should.eql(val);
                    });
                    done();
                }
            });
    },
    rmdirSync: deleteRecursiveSync
};
