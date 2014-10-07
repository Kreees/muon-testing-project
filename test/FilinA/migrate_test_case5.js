//var m = require('muon');
var Q = require("q");
//var dbg = true;
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var mysql = require('mysql');
var sqlite = require('sqlite3');

process.exit = function() {};


describe('migration module test: case 05 (multiple migrations with "migrate")', function() {

    var test_models_source_path = cfg.path + '/test/model_sets/set5/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set5/models_ch/';
    var test_models_changed_path1 = cfg.path + '/test/model_sets/set5/models_ch1/';


    before(function(done) {
        var mysql_client = mysql.createConnection({
            host : 'localhost',
            user : 'root',
            password : ''
        });
        mysql_client.connect(function(err, results) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("mysql server connected");
            mysql_client.query('drop database somedb', function(err) {
                if (err)
                    console.log(err);
                mysql_client.query('create database somedb', function(err) {
                    if (err)
                        console.log(err)
                    done()
                });
            });
        });
    });
//очищаем базу данных

    before(function(done) {
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
            done();
        });
    }); //удаляем все и загружаем исходные модели


    before(function(done) {
        global.__mcfg__ = {
            serverMode : 'development'
        };
        muon = require('muon');
        muon.ready(function() {
            console.log('muon ready in case 5');
            global.__mcfg__ = {
                serverMode : 'migration'
            };
            muon.reload(__mcfg__, function() {
                muon.ready(function() {
                    console.log('reloaded in case 5');
                    var prms = m.migration.migrate();
                    prms.done(function() {
                        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                            console.log('deleting models');
                            if (err)
                                console.log('readdir error ' + err)
                            for (var i in models) {
                                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                                    if (err)
                                        console.log('unlinking error 3 ' + err);
                                });
                            }
                            console.log('MIGRATION ONE END');
                            done();
                        });
                    }, function(err) {
                        done(err);
                    });
                });
            });
        });
    }); 
 //ищем изменения и проводим первую миграцию

    before(function(done) {
        fs.readdir(test_models_changed_path, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
//                console.log(i);
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path + models[i]));
            }
            done();
        });
    }); //загружаем вторые модели

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
//        muon = require('muon');
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                console.log('muon ready in case 5');
                global.__mcfg__ = { serverMode: 'migration' };
                muon.reload(__mcfg__, function() {
                    muon.ready(function() {
                        console.log('reloaded in case 5');
                        var prms = m.migration.migrate();
                        prms.done(function() {
                            fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                                console.log('deleting models');
                                if (err) {console.log('readdir error ' + err)}
                                for (var i in models) {
                                    fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                                        if (err) console.log('unlinking error 3 ' + err);
                                    });
                                }
                                console.log("MIGRATION TWO END");
                                done();
                            });
                        }, function(err){
                            done(err);
                        });
                    });
                });
            });
        });
    }); //ищем изменения и проводим вторую миграцию

    before(function(done) {
        fs.readdir(test_models_changed_path1, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
//                console.log(i);
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path1 + models[i]));
            }
            done();
        });
    }); //загружаем третью порцию моделей

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                console.log('muon ready in case 5');
                global.__mcfg__ = { serverMode: 'migration' };
                muon.reload(__mcfg__, function() {
                    muon.ready(function() {
                        console.log('reloaded in case 5');
                        var prms = m.migration.migrate();
                        prms.done(function() {
                            console.log("MIGRATION THREE END");
                            done()
                        });
                    });
                });
                });
            });
        }); //финальная миграция

    var first_state = {};
    it('should try to migrate to the first state and detect magic absence', function(done) {
        console.log('test start');
        var history_db = new sqlite.Database(cfg.path + '/migrations/history.db');
        var first_state = {};
        history_db.serialize(function() {
            history_db.get('select state_id from state limit 1',function(err,res) {
                console.log(res);
                first_state = res.state_id;
                console.log(typeof first_state);
//                m.migration.info(first_state);
                var prms = m.migration.migrate(first_state);
                prms.done(function(){
                    done();
                },function(err){
                    done(err);
                });
                    // catch(function(err) {
                        // console.log('ERROR OLOLOLO ' + err);
                        // done();
                    // })
            });
        });
    });

    it('should try to migrate to the first state', function(done) {
        m.migration.migrate(first_state).
            done(function() {
                console.log('syncing done');
                fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                    console.log('deleting models');
                    if (err) {console.log('readdir error ' + err)}
                    for (var i in models) {
                        fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                            if (err) console.log('unlinking error 3 ' + err);
                        });
                    }
                });
                fs.readdir(test_models_source_path, function(err, models) {
                    if (err) {console.log(err)}
                    for (var i in models) {
                        fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
                    }
                });
                global.__mcfg__ = { serverMode: 'development' };
                muon.reload(__mcfg__,function() {
                    try {
                        m.diff.need.should.be.false;
                        done();
                    }
                    catch(err) {console.log('ERROR '+err); done(err)}
                });
            }, function(err){done(err)});
    });
});