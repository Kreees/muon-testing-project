module.exports = {
    attributes: {
        "name": "text",
        "age": "number",
        "pool": "text"
    },
    db: "default1",
    hasOne:{
        "one":"car1"
    },
    hasMany:{
        "many":"pet"
    }
    
};