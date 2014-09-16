var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
var fs = require('fs');
var dir = cfg.path + '/migrations/';
var g = require("grunt");
var mysql = require('mysql');

process.exit = function() {};


describe('migration module test: case 06 (data integrity check)', function() {

    var test_models_source_path = cfg.path + '/test/model_sets/set6/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set6/models_ch/';

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
        global.__mcfg__ = { serverMode: 'development' };
        muon = require('muon');
        muon.ready(function() {
            console.log('muon ready in case 6');
            global.__mcfg__ = { serverMode: 'migration' };
            muon.reload(__mcfg__, function() {
                muon.ready(function() {
                    console.log('reloaded in case 6');
                    m.migration.migrate().then(function() {
                        done();
                    })

                });
//                done()
            });
        });
    }); //ищем изменения и проводим первую миграцию

    before(function(done) {  //добавляем данные
//        console.log(m.app.models);
        var Person = m.app.models.person;
        var Car = m.app.models.car;
        Person.sync(function(err) {
            if (err) console.log(err);
            var per1 = new Person;
            per1.name = 'Andy';
            per1.surname = 'Warhol';
            per1.age = 100;
            per1.save();
            var per2 = new Person;
            per2.name = 'Vincent';
            per2.surname = 'Van Gogh';
            per2.age = 200;
            per2.save();
        });
        Car.sync(function(err) {
            var car1 = new Car;
            car1.brand = 'Opel';
            car1.name = 'Astra';
            car1.engine = 'ecotec';
            car1.number = 279;
            car1.save();
            var car2 = new Car;
            car2.brand = 'Skoda';
            car2.name = 'Octavia';
            car2.engine = 'vagvag';
            car2.number = 359;
            car2.save(done);
        })
    }); //добавляем данные в базу

    before(function(done) {
        fs.readdir(cfg.path + '/server/app/models/', function(err, models) {
            console.log('deleting models');
            if (err) {console.log('readdir error ' + err)}
            for (var i in models) {
                fs.unlink(cfg.path + '/server/app/models/' + models[i], function(err) {
                    if (err) console.log('unlinking error 3 ' + err);
                });
            }
            done();
        });
    }); //удаляем модели

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
                console.log('muon ready in case 6');
                global.__mcfg__ = { serverMode: 'migration' };
                muon.reload(__mcfg__, function() {
                    muon.ready(function() {
                        console.log('reloaded in case 6');
                        m.migration.migrate().then(function() {
                            global.__mcfg__ = { serverMode: 'development' };
                            muon.reload(__mcfg__, function() {
                                muon.ready(done);
                            });
                        });
                    });
                });
            });
        })
    }); //ищем изменения и проводим вторую миграцию


    it('should check the data', function(done) {
        var Person_new = m.app.modes.person_new;
        var Car_new = m.app.models.car_new;
        console.log('test start');
        Person_new.get(1, function(err,res) {
            if (err) done(err);
            else {
                res.name_new.should.eql('Andy');
                res.surname_new.should.eql('Warhol');
                res.age_new.should.eql(100);
                Person_new.get(2, function(err,res) {
                    if (err) done(err);
                    else {
                        res.name_new.should.eql('Vincent');
                        res.surname_new.should.eql('Van Gogh');
                        res.age_new.should.eql(200);
                        Car_new.get(1, function(err,res) {
                            if (err) done(err);
                            else {
                                res.brand_new.should.eql('Opel');
                                res.name_new.should.eql('Astra');
                                res.engine_new.should.eql('ecotec');
                                res.number_new.should.eql(279);
                                Car_new.get(2, function(err,res) {
                                    if (err) done(err);
                                    else {
                                        res.brand_new.should.eql('Skoda');
                                        res.name_new.should.eql('Octavia');
                                        res.engine_new.should.eql('vagvag');
                                        res.number_new.should.eql(359);
                                        done()
                                    }
                                })
                            }
                        });
                    }
                });
            }
        });
    });

});