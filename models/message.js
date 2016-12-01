var mongoose = require('mongoose');

var msgSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    msg: mongoose.Schema.Types.Mixed,
    created: {
        type: Date,
        default: Date.now
    },
    room: String
});

module.exports = mongoose.model('Message', msgSchema);