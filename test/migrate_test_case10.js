var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var sh = require('should');
var mysql = require('mysql');

process.exit = function() {};


describe('migration module test: case 10 (move mode to another database)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set10/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set10/models_ch/';

    before(function(done) {
        var mysql_client = mysql.createConnection({
            host:'localhost',
            user: 'root',
            password: ''
        });
        mysql_client.connect(function(err, results) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("mysql server connected");
            mysql_client.query(
                'drop database testdb', function(err) {
                    if (err) console.log(err);
                    mysql_client.query(
                        'create database testdb', function(err) {
                            if (err) console.log(err)
                            mysql_client.query(
                                'drop database somedb', function(err) {
                                    if (err) console.log(err);
                                    mysql_client.query(
                                        'create database somedb', function(err) {
                                            if (err) console.log(err)
                                            done()
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            );
        });
    }); //очищаем базы данных

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

            setTimeout(function() {
                done();
            }, 10);
        });
    }); //удаляем все и загружаем модели

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
//        muon.once('migrate-ready', function() {
        muon.ready(function() {
            console.log('muon ready in case 10');
//            done();
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                console.log('reloaded in case 10');
                m.migration.migrate().then(done);
            });
        });
    }); //предварительная миграция

    before(function(done) {
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            if (err) {console.log('readdir error ' + err)}
            console.log('models are ' + models)
            for (var i in models) {
                console.log('1 ' + models[i])
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                    console.log('2' + models[i])
                    if (err) console.log('unlinking error 3 ' + err)
                })
            }
        });
        fs.readdir(test_models_changed_path, function(err, models) {
            if (err) {console.log(err)}
            for (var i in models) {
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path + models[i]));
            }

            setTimeout(function() {
                done();
            }, 10);
        });
//        setTimeout(function() {done()},2000);
    }); //удаляем старые модели и загружаем новые

    it('should detect model database change', function(done) {
        console.log('test start');
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                try {
                    m.diff.need.should.be.true;
                    m.diff.err.should.not.eql([]);
                    m.diff.rmModel.should.not.eql([]);
                    m.diff.rmAttr.should.eql({});
                    m.diff.addModel.should.not.eql([]);
                    m.diff.addAttr.should.eql({});
                    done();
                }
                catch(err) {console.log('ERROR ' + err); done(err)}
            });
//            done();
        })
    });

    it('should try to move model to another database and get rejected', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                m.migration.migrate()
                    .catch(function(err) {
                        try{
                            err.should.startWith('Migration not able');
                            done()
                        }
                        catch(err) {done(err)}
                    })

            });
        });
    });

    it('should try to force move model to another database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                m.migration.migrate([],true)
                    .catch(function(err) {
//                        try{
//                            err.should.startWith('Migration not able');
//                            done()
//                        }
                        done(err);
                    })
                    .done(function() {
                        done();
                    })

            });
        });
    });

});