var Q = require("q");
//var cfg = {path: '/Users/andrejfilin/some'};
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var mysql = require('mysql');
var errlog = function(err){
    if(err) console.log("TEST ERROR:"+ err);
} 

process.exit = function() {};

describe('migration module test: case 02 (remove a model)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set2/models_s/';

    before(function(done) {
        var mysql_client = mysql.createConnection({
            host : 'localhost',
            user : 'root',
            password : ''
        });
        mysql_client.connect(function(err, results) {
            if (err)
                throw err;
            console.log("mysql server connected");
            mysql_client.query('drop database somedb', function(err) {
                errlog(err);
                mysql_client.query('create database somedb', function(err) {
                    errlog(err)
                    done();
                })
            });
        });
    });
//очищаем базы данных
    before(function() {
        if (!g.file.exists(dir))
            g.file.mkdir(dir);
        if (g.file.exists(cfg.path + '/migrations/history.db'))
            fs.unlink(cfg.path + '/migrations/history.db', function(err) {
                errlog(err);
            });
        if(g.file.exists(cfg.path + '/undefined.db'))
            fs.unlink(cfg.path + '/undefined.db', function(err) {
                errlog(err);
            });
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            errlog(err);
            for (var i in models) {
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {if (err) console.log('unlinking error 3 ' +err)});
            }
        });
        fs.readdir(test_models_source_path, function(err, models) {
            errlog(err);
            for (var i in models) {
                fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_source_path + models[i]));
            }
        });
    });

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.ready(function() {
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                var prms = m.migration.migrate();
                prms.done(function() {
                    fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                        errlog(err);
                        for (var i in models) {
                            fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                                errlog(err)
                                // setTimeout(function(){done();},50);
                                done();
                            });
                        }
                    });
                },function(err){
                    done(err);
                });
            });
        });
    });

    // before(function(done) {
        // fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            // if (err) {console.log('readdir error ' + err)}
            // done();
        // })
    // });

    it('should detect model removal', function(done) {
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
                catch(err) {
                    done(err);
                }
            });
        });
    });

    it('should remove model from the database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                m.migration.migrate()
                    .then(function() {
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
                                'use somedb', function(err) {
                                    if (err) console.log(err);
                                    mysql_client.query(
                                        'show tables', function(err,result) {
                                            if (err)
                                            {console.log(err); done(err)}
                                            else{
                                                try{
                                                    result.should.eql([]);
                                                }
                                                catch(err) {console.log(err); done(err)}
                                            }
                                        }
                                    )
                                }
                            );
                        });




//                        console.log(m.app.models);
//                        var Person = m.app.models.person;
//                        try{
//                            Person.get(1, function(err,result) {
//                                if (err)
//                                {console.log(err)
//                                }
//                            });
//                        }
//                        catch(err) {
//                        if (err) {
//                            console.log(err)
//                            err.message.should.eql("Cannot call method 'get' of undefined");
//                            done();
//                        }
//                        else {
//                             var error = new Error;
//                            done(error)
//                                }
//                        }
                })
                    .catch(function(err) {
                        if (err) {
                            var Err = new Error;
                            Err.message = err;
                            done(Err);
                        }
//                        done(err);
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