module.exports = {
    attributes: {
        "name": "text",
        "surname": "text",
        "loss":"number",
        "male":"boolean"
    },
    hasOne:{
        "one":"car"
    },
    hasMany:{
        "many":"pet"
    }
};