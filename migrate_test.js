    console.log(__filename);
    var orm = require('orm');
    var _ = require('underscore');
    var Q = require("q");
    var Sync = require('sql-ddl-sync').Sync;
    var g = require("grunt");
    var chai = require("chai");
    var _db;
    var dbg = true;
    var sh = require('should');
//    var cfg = deps.config.load();
    var cfg = {path: '/Users/andrejfilin/some'};
//    var m = require('muon');
    var sqlite3 = require('sqlite3');


    function _initDb(){
        var dfd = Q.defer();
        if (!g.file.exists(cfg.path+"/migrations/history.db"))
        console.log('no database to connect to!');
        orm.connect("sqlite://"+cfg.path+"/migrations/history.db", function(err, db){
            if (err){
//                deps.logger.exception(err);
                console.log('i got an error while connecting to a database' + err)
                dfd.reject(err);
            }

            _db = db;
            console.log('connected!!')
            var State = db.define("state",{
                state_id: Number,
                scheme: Object,
                comment: String
            });
            State.sync(function(){
                console.log('state sync done')
                dfd.resolve();
            });
        });
        return dfd.promise;
    }

    function _loadState(id, cb) {
        var dfd = Q.defer();
        if ( typeof (id) == "number") {
            if (dbg)
                console.log("Try loading state: " + id);
            _db.models.state.find({
                state_id : id
            }, function(err, item) {
                if (err) {
//                    deps.logger.exception(err);
                    dfd.reject(err);
                }
                if (dbg)
                    console.log("Loaded state: " + item.state_id + " Comment: " + item.comment);
                cb(item);
                dfd.resolve();
            });
        } else {
            if (dbg)
                console.log("Try loading last state... ");
            _db.models.state.find().last(function(err, stt) {
                if(err){
//                    deps.logger.exception(err);
                    dfd.reject(err);
                }
                if (stt && stt.state_id) {
                    if (dbg)
                        console.log("Loaded state: " + stt.state_id + " Comment: " + stt.comment);
                } else {
                    if (dbg)
                        console.log("No migration states.");
                }
                cb(stt);
                dfd.resolve();
            });
        }
        return dfd.promise;
    }

    function _difference(userS, dbS) { //TODO извлечь информацию об отношениях
        var ormS = JSON.parse(JSON.stringify(dbS));
        var errs = [];
        var rmInfo = {};
        var addInfo = {};
        var toAdd = [];
        var flagNeed = false;
        for (var mdl in userS) {
            var userModel = userS[mdl];
            var sncModel = ormS[mdl];
            if (sncModel) {// find new models
                for (var atr in userModel) {// find new model attributes
                    if (!sncModel[atr]) {
                        sncModel[atr] = userModel[atr];
                        if (!addInfo[mdl])
                            addInfo[mdl] = [];
                        addInfo[mdl].push(atr);
                        flagNeed = true;
                    } else {
                        if (!_.isEqual(sncModel[atr], userModel[atr])) {//model attribute was changed - error
                            errs.push("Model: " + mdl + " Attribute: " + atr + ' was changed. Migration cannot be complete.');
                        }
                    }
                }
                for (var atr in sncModel) {// find model attrs to remove
                    if (!userModel[atr]) {
                        if (!rmInfo[mdl])
                            rmInfo[mdl] = [];
                        rmInfo[mdl].push(atr);
                        flagNeed = true;
                    }
                }
            } else {
                ormS[mdl] = userModel;
                toAdd.push(mdl);
                flagNeed = true;
            }
        }
        var toRm = [];
        for (var mdl in ormS) {
            if (!userS[mdl]){
                toRm.push(mdl);
                flagNeed = true;
            }
        }
        console.log('looking for some changes...')
        return {
            need: flagNeed,
            ormModels : ormS,
            rmModels : toRm,
            rmModelAttr : rmInfo,
            addModelAttr : addInfo,
            addModels : toAdd,
            errs : errs,
            hasOne: false,
            hasMany: false
        };
    }

    function _sync(driver_name, driver, scheme) {
        var def = Q.defer();
        if (dbg) console.log("Synced.  ---fake---");
        return Q();
//TODO
        var sync = new Sync({
            dialect : driver_name,
            driver : driver,
            debug : function(text) {
                if(dbg) console.log("> %s", text);
            }
        });
        for (var i in scheme) {
            sync.defineCollection(i, preprocessProperties(scheme[i]));
        }
        sync.sync(function(err) {
            if (err) {
                if(dbg) console.log(">>> Sync Error: " + err);
                return def.reject(new Error(">>> Sync Error: " + err));
            } else {
                if(dbg) console.log(">>> successfull synced.");
                def.resolve();
            }
        });
        return def.promise;
    }

    function _saveState(id, obj) {
        var dfd = Q.defer();
        _db.models.state.find({"state_id":id},function(err, res){
            if (err) {
//                deps.logger.exception(err);
                dfd.reject(err);
            }
            if(res.length != 0) {
                res[0].scheme = obj;
                res[0].save(function(err){
                    if(err){
//                        deps.logger.exception(err);
                        dfd.reject(err);
                    }
                });
            }else {
                _db.models.state.create({
                    state_id : id,
                    scheme : obj,
                    comment : "no comment"
                }, function(err, res) {
                    if (err) {
//                        deps.logger.exception(err);
                        dfd.reject(err);
                    }
                    if (dbg)
                        console.log("State saved: " + id);
                    dfd.resolve();
                });
            }
        });
        return dfd.promise;
    }

    function _unifyScheme(obj) { // должна унифицировать схему, чтобы не зависило от орма
        return obj;
    }

    function _loadMagic(path) {
        if (!g.file.exists(path)) return false;
        return function() {
            var d = Q.defer();
            setTimeout(function() {
                d.resolve();
            }, 100);
            return d.promise;
        };
    }


    var fs = require('fs');
    var dir = cfg.path + '/migrations/';
    var test_models_source_path = cfg.path + '/test/models_s/';
    var test_models_changed_path = cfg.path + '/test/models_ch/';
    console.log('performing the test');

    describe('migration test', function() {

        before(function() {
//            console.log('before 1');
            if (!g.file.exists(dir))
                g.file.mkdir(dir);
            if (g.file.exists(cfg.path + '/migrations/history.db'))
            fs.unlink(cfg.path + '/migrations/history.db', function(err) {
                if (err) console.log('unlinking error 1 ' + err)
            });
            if(g.file.exists(cfg.path + '/undefined.db'))
            fs.unlink(cfg.path + '/undefined.db', function(err) {
                if (err) console.log('unlinking error 2 ' + err)
            });

            fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                if (err) {console.log('readdir error ' + err)}
                for (var i in models) {
                    fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {if (err) console.log('unlinking error 3 ' +err)});
                }
            });
            fs.readdir(test_models_source_path, function(err, models) {
                if (err) {console.log(err)}
                for (var i in models) {
                    fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
                }
            });
    });

        before(function() {
//            console.log('before 2');
            if (!g.file.exists(cfg.path+"/migrations/history.db"))
                g.file.write(cfg.path+"/migrations/history.db");
        })

        before(function(done) {
            m = require('muon');
            m.ready(function() {
            console.log('muon ready');
            done();
        })});

        it('should create initial database', function(done) {
            _initDb()
                .done(function() {
//                    var blabla = fs.existsSync(cfg.path + '/undefined.db');
//                    console.log('blabla is ' + blabla);
//                    expect(fs.existsSync(cfg.path + '/undefined.db')).to.be.true;
                    done();
                });
        });

        it('should load initial models to the base', function(done) {
            var count = 0;
            var models_in_folder = fs.readdirSync(test_models_source_path);
            for (var i in m.app.models) {

                var j = i + '.js';
                console.log(j);
                j.should.equal(models_in_folder[count]);
                count++;
            }

            var usrScheme = {};
            for (var i in m.app.models) {
                console.log(i)
                usrScheme[i] = m.app.models[i].allProperties;
            }
            _sync(driver_name, driver, usrScheme)
                .catch(function(error) {done(error)})
                .done(function() {done()});

            //somehow control database contents


        });

        it('should save the initial migration state', function(done) {

            var usrScheme = {};
            for (var i in m.app.models) {
                console.log(i)
                usrScheme[i] = m.app.models[i].allProperties;
            }
            var dbScheme = {};
            var diff = _difference(usrScheme, dbScheme);
            console.log('diff.need in save migration state test is ' +diff.need);
            var stateId = new Date().getTime();
            _saveState(stateId, diff.ormModels)
                .catch(function(error) {done(error)})
                .done(function() {done()});
        });

        it('should change models', function() {
            console.log('now change models');
            fs.readdir(test_models_changed_path, function(err, models) {
                if (err) {console.log(err)}
                for (var i in models) {
                    fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path + models[i]));
                }
            });
        });

        it('should reload muon', function(done) {
            m.reload().done(function() {
                console.log('muon reloaded');
                done();
            });
//            m.ready(function() {
//                console.log('muon reloaded');
//                done();
//            })
        });

        it('should detect changes', function(done) {
//            deps.plugins.reloadScope(diff);
            var usrScheme = {};

            for (var i in m.app.models) {
                console.log(i)
                usrScheme[i] = m.app.models[i].allProperties;
            }
            var dbScheme = {};
            var diff = {};
            var stateId;
            var err = new Error('no changes detected');
            prms = _initDb()
                .then(function() {

                    return _loadState(stateId, function(stt) {
                        if (stt && stt.state_id) dbScheme = stt.scheme || {};
                        else dbScheme = {};
                    });
                }).then(function() {//извлекает информацию о различиях и добавляет в базу новые таблицы и колонки
                    console.log("now going to detect changes");
                    diff = _difference(usrScheme, dbScheme);
                    console.log('diff.need is ' + diff.need);
                    if (diff.need) done();
                    else done(err);
//                    expect(diff.need).to.be.true;
                })
        });

        it('should check the magic file', function(done) {
            var check = _loadMagic(cfg.path + '/migrations/magic.js');
            var err = new Error('no magic file');
            if (!check) done(err);
                else check().done(done());
        })
    });