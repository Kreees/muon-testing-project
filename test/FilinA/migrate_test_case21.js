var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var mysql = require('mysql');

process.exit = function() {};

describe('migration module test: case 21 (remove a model with sync)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set21/models_s/';

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
                'drop database somedb', function(err) {
                    if (err) console.log(err);
                    mysql_client.query(
                        'create database somedb', function(err) {
                            if (err) console.log(err)
                            done()
                        }
                    )
                }
            );
        });
    }); //очищаем базы данных

    before(function() {
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

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
//        muon.once('migrate-ready', function() {
        muon.ready(function() {
            console.log('muon ready');
//            done();
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                m.migration.migrate()
                    .then(function() {
                        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                            console.log(models);
                            if (err) {console.log('readdir error ' + err)}
                            for (var i in models) {
                                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                                    if (err) console.log('unlinking error 3 ' + err)
                                    setTimeout(function() {done()},50);
//                                    done();
                                });
                            }
                        });
                    });
            });
        });
    });

    before(function(done) {
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            if (err) {console.log('readdir error ' + err)};
            console.log(models);
            done();
        })
    })

    it('should detect model removal', function(done) {
        console.log('test start');
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                try {
                    m.diff.need.should.be.true;
                    m.diff.rmModel.should.not.eql([]);
                    m.diff.rmAttr.should.eql({});
                    m.diff.addModel.should.eql([]);
                    m.diff.addAttr.should.eql({});
                    done();
                }
                catch(err) {console.log('ERROR '+err); done(err)}

            });
        });
    });

    it('should remove model from the database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                m.migration.sync()
                    .then(function() {
                        var Person = m.app.models.person;
                        try{
                            Person.get(1, function(err,result) {
                                if (err)
                                {console.log(err)
                                }
                            });
                        }
                        catch(err) {
                            if (err) {
                                err.message.should.eql("Cannot call method 'get' of undefined")
                                done();
                            }
                            else {
                                var error = new Error;
                                done(error)
                            }
                        }
//                    error = new Error;
//                    console.log('err ' + err)
//                    if (err) {done()}
//                    else {done()}
                    })
            });
        });
    });

    it('should detect nothing', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                console.log('DIFFNEED ' + m.diff.need);
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