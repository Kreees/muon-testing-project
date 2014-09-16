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


describe('migration module test: case 18 (change scheme)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set18/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set18/models_ch/';

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
    });

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
    });

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.ready(function() {
            console.log('muon ready in case 18');
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                console.log('reloaded in case 18');
                m.migration.migrate()
                    .then(function() {
                        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
                            if (err) {console.log('readdir error ' + err)}
                            for (var i in models) {
                                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                                    if (err) console.log('unlinking error 3 ' + err)
                                    fs.readdir(test_models_changed_path, function(err, models) {
                                        if (err) {console.log(err)}
                                        for (var i in models) {
//                                    console.log(i);
                                            fs.writeFileSync(cfg.path + '/server/app/models/' + models[i], fs.readFileSync(test_models_changed_path + models[i]));
                                        }
                                        done();
                                    });
                                });
                            }
                        });
                    });
            });
        });
    });

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
            console.log("connected.");
            mysql_client.query(
                'use somedb', function(err) {
                    if (err) console.log(err);
                    mysql_client.query(
                        'alter table person add column name1 int', function(err) {
                            if (err) console.log(err);
                            console.log('column created');
                            mysql_client.query(
                                'create table ololo (id int)', function(err) {
                                    if (err) console.log(err);
                                    console.log('table created');
                                    done()
                                }
                            )
                        }
                    )
                }
            );
        });
    });

    it('should detect an error', function(done) {
        console.log('test start');
        global.__mcfg__ = { serverMode: 'development' };
        muon.reload(__mcfg__,function() {
            muon.ready(function() {
                try {
                    console.log('diff.err ' + JSON.stringify(m.diff.err))
//                    m.diff.need.should.be.true;
//                    m.diff.rmModel.should.eql([]);
//                    m.diff.rmAttr.should.eql({});
                    m.diff.err.should.not.eql([]);
//                    m.diff.addAttr.should.not.eql({});
                    done();
                }
                catch(err) {console.log('ERROR '+err); done(err)}
            });
//            done();
        })
    });

//    it('should detect new model and attribute', function(done) {
//        console.log('test start');
//        global.__mcfg__ = { serverMode: 'development' };
//        muon.reload(__mcfg__,function() {
//            muon.ready(function() {
//                try {
//                    console.log('diff.err ' + m.diff.err)
//                    m.diff.need.should.be.true;
//                    m.diff.rmModel.should.eql([]);
//                    m.diff.rmAttr.should.eql({});
//                    m.diff.addModel.should.not.eql([]);
//                    m.diff.addAttr.should.not.eql({});
//                    done();
//                }
//                catch(err) {console.log('ERROR '+err); done(err)}
//            });
////            done();
//        })
//    });
//
//    it('should add new model and attribute to the database', function(done) {
//        global.__mcfg__ = { serverMode: 'migration' };
//        muon.reload(__mcfg__, function() {
//            muon.ready(function() {
//                console.log('diff.err ' + m.diff.err);
//                m.migration.migrate().then(function() {
//                    function get_instance(model_names, models_quantity, count) {
//                        var userModel = m.app.models[model_names[count]];
////                        console.log(model_names[count]);
////                        console.log(userModel);
//                        userModel.get(1, function(err,result) {
//                            if (err)
//                            {   console.log(err);
//                                err.message.should.eql('Not found');
//                                err.model.should.eql(m.app.models[model_names[count]].modelName);
//                            }
//                            count ++;
//                            if (count < models_quantity) {
//                                get_instance(model_names, models_quantity, count)
//                            }
//                            else done();
//                        });
//                    }
//                    var z = 0;
//                    var model_names = [];
//                    for (var i in m.app.models) {
//                        console.log(i);
//                        model_names[z] = i;
//                        z = z + 1;
//                    }
////                    console.log(model_names)
////                    console.log('z equals ' + z);
//                    var count = 0;
//                    get_instance(model_names, z, count);
//                })
//            });
//        });
//    });
//
//    it('should detect nothing', function(done) {
//        global.__mcfg__ = { serverMode: 'development' };
//        muon.reload(__mcfg__,function() {
//            muon.ready(function() {
//                try {
//                    m.diff.need.should.be.false;
//                    m.diff.rmModel.should.eql([]);
//                    m.diff.rmAttr.should.eql({});
//                    m.diff.addModel.should.eql([]);
//                    m.diff.addAttr.should.eql({});
//                    done();
//                }
//                catch(err) {console.log('ERROR '+err); done(err)}
//            });
//        })
//    });
//
//    it('should add an instance with new attribute', function(done) {
//        var Person = m.app.models.person;
//        Person.sync(function(err) {
//            if (err) {console.log('sync error: ' + err); done(err)}
//            else {
//                console.log('table synced');
//                var per1 = new Person;
//                per1.name = 'Andy';
//                per1.surname = 'Warhol';
//                per1.age = 150;
//                per1.weight = 100;
//                per1.save(function(err) {
//                    if (err) {console.log('save error: ' + err); done(err)}
//                    else {
//                        Person.get(1, function(err, result) {
//                            if (err) {console.log('save error: ' + err); done(err)}
//                            else {
//                                result.name.should.eql('Andy');
//                                result.surname.should.eql('Warhol');
//                                result.age.should.eql(150);
//                                result.weight.should.eql(100);
//                                done();
//                            }
//                        })
//                    }
//                });
//            }
//        });
//    });
//
//    it('should add an instance to added model', function(done) {
//        var Car = m.app.models.car;
//        Car.sync(function(err) {
//            if (err) {console.log('sync error: ' + err); done(err)}
//            else {
//                console.log('table synced');
//                var car1 = new Car;
//                car1.brand = 'Opel';
//                car1.name = 'Astra';
//                car1.number = 279;
//                car1.engine = 'x18xe1';
//                car1.save(function(err) {
//                    if (err) {console.log('save error: ' + err); done(err)}
//                    else {
//                        Car.get(1, function(err, result) {
//                            if (err) {console.log('save error: ' + err); done(err)}
//                            else {
//                                result.brand.should.eql('Opel');
//                                result.name.should.eql('Astra');
//                                result.number.should.eql(279);
//                                result.engine.should.eql('x18xe1');
//                                done();
//                            }
//                        })
//                    }
//                });
//            }
//        });
//    });
//
//    it('should print something', function(done) {
//        console.log('ololo');
//        done();
//    })

});