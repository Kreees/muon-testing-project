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

describe('migration module test: case 09 (change attribute for models in different databases)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set9/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set9/models_ch/';

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
//                console.log('bablabla');
                done();
            }, 10);
        });
    }); //удаляем все и загружаем модели

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
//        muon.once('migrate-ready', function() {
        muon.ready(function() {
            console.log('muon ready in case 9');
//            done();
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                console.log('reloaded in case 7');
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
//                console.log('bablabla');
                done();
            }, 10);
        });
//        setTimeout(function() {done()},2000);
    }); //удаляем старые модели и загружаем новые

    it('should detect attribute change', function(done) {
        console.log('test start');
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                try {
                    m.diff.need.should.be.true;
                    m.diff.rmModel.should.eql([]);
                    m.diff.rmAttr.should.not.eql({});
                    m.diff.addModel.should.eql([]);
                    m.diff.addAttr.should.not.eql({});
                    done();
                }
                catch(err) {console.log('ERROR ' + err); done(err)}
            });
//            done();
        })
    });

    it('should change attribute', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                m.migration.migrate().then(function() {
                    for (var i in m.app.models) {
                        console.log(i);
                        var userModel = m.app.models[i];

//                        userModel.get(1, function(err,result) {
//                            if (err)
//                            {   console.log(err)
//                                err.message.should.eql('Not found');
//                                err.model.should.eql(m.app.models[i].modelName);
////                        done();
//                            }
//                            else {
////                        var error = new Error;
////                        done(error)
//                            }
////            done();
//                        });
                    }
                    done()
                })

            });
        });
    });

    it('should detect nothing', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                try {
                    m.diff.need.should.be.false;
                    m.diff.rmModel.should.eql([]);
                    m.diff.rmAttr.should.eql({});
                    m.diff.addModel.should.eql([]);
                    m.diff.addAttr.should.eql({});
                    done();
                }
                catch(err) {console.log('ERROR '+err); done(err)}
            });
        })

    });

});