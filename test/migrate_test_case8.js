//var m = require('muon');
var Q = require("q");
//var dbg = true;
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var sh = require('should');
var mysql = require('mysql');

process.exit = function() {};


describe('migration module test: case 08 (add models to specified databases)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set8/models_ch/';

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

    before(function() {
        global.__mcfg__ = { serverMode: 'development' };
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
    }); //удаляем все и загружаем модели

    it('should detect a new model', function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.once('migrate-ready', function() {
            console.log('muon ready');
            console.log(m.diff.need);
            try {
                m.diff.need.should.be.true;
                m.diff.rmModel.should.eql([]);
                m.diff.rmAttr.should.eql({});
                m.diff.addModel.should.not.eql([]);
                m.diff.addAttr.should.eql({});
                done();
            }
            catch(err) {console.log('ERROR '+err); done(err)}
        });
    });

    it('should add model to the database', function(done) {
        global.__mcfg__ = { serverMode: 'migration' };
        muon.reload(__mcfg__, function() {
            muon.ready(function() {
                console.log('NOW MIGRATE!!!');
                m.migration.migrate();
                muon.once("migrate-run-ready", function() {
                    console.log('signal received');
                    var Person = m.app.models.person;
                    Person.get(1, function(err,result) {
                            if (err)
                            {err.message.should.eql('Not found');
                            err.model.should.eql('person');
                            done();
                            }
                        else {
                            var error = new Error;
                            done(error)
                            }
                    });
//                        done();
                });
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

    it('should create an instance in a database', function(done) {
        var Person = m.app.models.person;
        Person.sync(function(err) {
            if (err) {console.log('sync error: ' + err); done(err)}
            else {
            console.log('table synced');
            var per1 = new Person;
            per1.name = 'Andy';
            per1.surname = 'Warhol';
            per1.age = 150;
            per1.save(function(err) {
                if (err) {console.log('save error: ' + err); done(err)}
                else {
                    Person.get(1, function(err, result) {
                        if (err) {console.log('save error: ' + err); done(err)}
                        else {
                            result.name.should.eql('Andy');
                            result.surname.should.eql('Warhol');
                            result.age.should.eql(150);
                            done();
                        }
                    })
                }

            });


            }
        });

    });

});