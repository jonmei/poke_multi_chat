var socket = io.connect('/chat');
var checkedRoom = 0;
var typing = false;
var timeout = undefined;
var coordinates;

// Rooms
var $firstRoom = $('#first');
var $secondRoom = $('#second');
var $thirdRoom = $('#third');
var $fourthRoom = $('#fourth');

var users = [];
var map;
var username;

$('#send').click(function() {
    $('form.send').submit();
});

$('form.send').submit(function(e){
    var msg = $('#m').val().trim()
    if( !validateMsg($('#m')) ) {
        return false;
    }
    if(msg === 'map') {
        geoFindMe().then(function(coords) {
            msg = coords;
            socket.emit('chat message', msg);
        }, function(error) {
            msg = error;
        })
    } else {
        socket.emit('chat message', msg);
    }
    $('#m').val('');
    return false;
});

$('#location').click(function() {
    geoFindMe().then(function(coords) {
        socket.emit('chat message', coords);
    }, function(error) {
        msg = error;
    });
});


$('#room input').click(function() {
    if(checkedRoom === $('#room').find('input:checked').first().val()){
        return false;
    } else if(checkedRoom !== "undefined") {
        socket.emit('unsubscribe', checkedRoom);
        $('#messages .mCSB_container').html('');
    }

    checkedRoom = $('#room').find('input:checked').val();
    socket.emit('subscribe', checkedRoom);
});

// Initiliaze chat
socket.on('init', function(data) {
    username = data.name;
    $firstRoom.siblings('.chat-select-room').html('@'+data.city);
    $secondRoom.siblings('.chat-select-room').html('@'+data.team);
    $thirdRoom.siblings('.chat-select-room').html('@'+data.city + ' + ' + '@'+ data.team);
    $fourthRoom.siblings('.chat-select-room').html('@bendras');

    $('body').css({
        'background-image': 'url("../images/'+data.team+'.jpg'
    });

    socket.emit('subscribe', checkedRoom);
});

// Load selected room messages
socket.on('load old msgs', function(data) {
    $('#messages .mCSB_container').html('');
    $('#messages .mCSB_container').append(createTypingWrapper());
    for(var i=data.docs.length-1; i >= 0; i--) {
        if(data.docs[i].msg && typeof data.docs[i].msg === 'object') {
            var label = data.docs[i].name.substring(0,1).toUpperCase();
            var mapWrapper = $(createStaticMap(data.docs[i].msg));
            var msgWrapper = $(createMsgWrapper(data.docs[i].name, ' ', data.docs[i].created));

            msgWrapper.find('.chat-msg').append(mapWrapper);
            msgWrapper.insertBefore('.chat-typing-wrapper');
        } else if(data.docs[i].msg && typeof data.docs[i].msg === 'string') {
            $(createMsgWrapper(data.docs[i].name, data.docs[i].msg, data.docs[i].created)).insertBefore('.chat-typing-wrapper');
        }
    }
});

// Event on enter chat message
socket.on('chat message', function(data) {
    if(typeof data.msg === 'object') {
        var label = data.name.substring(0,1).toUpperCase();
        var mapWrapper = $(createStaticMap(data.msg));
        var msgWrapper = $(createMsgWrapper(data.name, ' ',new Date()));

        msgWrapper.find('.chat-msg').append(mapWrapper);
        msgWrapper.insertBefore('.chat-typing-wrapper');
        socket.emit('typing', false);

        return;
    }
    $(createMsgWrapper(data.name, data.msg, new Date())).insertBefore('.chat-typing-wrapper');
    socket.emit('typing', false);
});

// Event on user list change in room
socket.on('users', function(users) {
    $('#chat-user-list .mCSB_container').html('');
    for(var i=0; i < users.length; i++) {
        $('#chat-user-list .mCSB_container').append(createUserElement(users[i]));
    }
});

// Event on user is typing
socket.on('isTyping', function(data) {
    var $typingElement = $(createTypingElement(data.name));

    if (!$(".typing-item-" + data.name).length)
        $('.chat-typing-wrapper').append($typingElement);
    if(data.isTyping){
        $typingElement.html(data.name + ' rašo..');
    } else {
        $(".typing-item-" + data.name).remove();
    }
});

// Event on user got kick
socket.on('kick', function(data) {
    $(createErrorMsgWrapper(data)).insertBefore('.chat-typing-wrapper');
});

socket.on('disconnect', function() {
    if( $(".typing-item-" + username).length) {
        $(".typing-item-" + username).remove();
    }
    var msg = 'Jūs buvote atjungtas..';
    $(createErrorMsgWrapper(msg)).insertBefore('.chat-typing-wrapper');
});

$('#m').keyup(function() {
    typing = true;
    socket.emit('typing', true);
    clearTimeout(timeout);
    timeout = setTimeout(timeoutFunction, 400);
});

// Scrollbars
$("#messages").mCustomScrollbar({
    axis: "y",
    setHeight: 560,
    callbacks:{
        onUpdate:function(){
            var $container = $('#mCSB_1_container');
            var containerHeight = $container.height();
            var containerOffsetTop = parseInt($container.css('top'),10);
            var scrollInsideHeight = $(this).find('.mCSB_inside').height();
            var inputHeight = $('form.send').height();
            if(containerHeight + containerOffsetTop - scrollInsideHeight < 170) {
                $(this).mCustomScrollbar("scrollTo","bottom");
            }
        },
        onInit: function(){
            $(this).mCustomScrollbar("scrollTo","bottom");
        }
    }
});
$("#chat-user-list").mCustomScrollbar({
    axis: "y",
    theme: 'rounded-dots',
    autoHideScrollbar: true
});
// Find location
function geoFindMe() {

    return new Promise(function(resolve, reject) {
        if (!navigator.geolocation){
            reject(Error("<p>Geolocation is not supported by your browser</p>"));
        }

        function success(position) {
            var coords = {
                latitude  : position.coords.latitude,
                longitude : position.coords.longitude
            };
            resolve(coords)
        };

        function error() {
            reject(Error("Unable to retrieve your location"));
        };

        navigator.geolocation.getCurrentPosition(success, error);
    });

};
// Validation
function validateMsg($input) {
    var msg = $input.val();
    if(msg.length > 255) {
        var notification = 'Žinutė per ilga.<br> Žinutės tekstas gali susidaryti iš daugiausiai 255 simbolių';
        showPopover($input,notification);
        msg.substring(0, 255);
        return false;
    }
    if(!msg || msg.trim() === '') {
        var notification = 'Žinutės laukas negali būti tuščias.';
        showPopover($input, notification);
        return false;
    }
    return true;
}
function showPopover($element, text) {
    $element.popover({
        content: '<div class="text-center">'+ text +'</div>',
        placement: 'top',
        html: 'true',
        delay: {
            "show": 500,
            "hide": 100
        }
    });
    $element.popover('show');
    setTimeout(function() {
        $element.popover('destroy');
    }, 1800);
}
function createErrorMsgWrapper(msg) {
    var errorMsgOverall = document.createElement("span");
    var errorText = document.createTextNode(msg);

    errorMsgOverall.className = "chat-error-msg";
    errorMsgOverall.appendChild(errorText);

    return errorMsgOverall;
}
function createMsgWrapper(name,msg,time) {
    // Msg wrapper
    var msgWrapper = document.createElement("div");
    msgWrapper.className = "chat-msg-wrapper";

    // User element creation
    var usrOverall = document.createElement("span");
    var usrText = document.createTextNode(name);
    usrOverall.className = "chat-usr";
    usrOverall.appendChild(usrText);
    msgWrapper.appendChild(usrOverall);

    if(time){
        // Time creation
        var date = new Date(time);
        var msgTime = getMsgTime(date);
        var timeOverall = document.createElement("span");
        var timeText = document.createTextNode(msgTime);
        timeOverall.className = "msg-time";
        timeOverall.appendChild(timeText);
        msgWrapper.appendChild(timeOverall);
    }
    if(msg) {
        // Colon creation
        var clnOverall = document.createElement("span");
        var clnText = document.createTextNode(":");
        clnOverall.className = "colon";
        clnOverall.appendChild(clnText);
        msgWrapper.appendChild(clnOverall);

        // Msg element creation
        var msgOverall = document.createElement("span");
        var msgText = document.createTextNode(msg);
        msgOverall.className = "chat-msg";
        msgOverall.appendChild(msgText);
        msgWrapper.appendChild(msgOverall);
    }

    return msgWrapper;
}

function getMsgTime(date) {
    var currentDate = new Date();
    var msgTime = date;
    if(date.getYear() === currentDate.getYear() && date.getMonth() === currentDate.getMonth() && date.getDay() === currentDate.getDay()) {
        return moment.utc(date).local().format('LT');

    } else {
        return moment(date).locale('lt').format('L');
    }
}

function createStaticMap(coords) {
    var img = new Image();
    img.src = "https://maps.googleapis.com/maps/api/staticmap?&&markers=color:blue%7Clabel:%7C" + coords.latitude + "," + coords.longitude + "&center=" + coords.latitude + "," + coords.longitude + "&zoom=14&size=300x150&sensor=false&key=AIzaSyDBGVaQzUsMCQzCXnl_cEf7V85JPGQtlQo";
    return img;
}

function createUserElement(name) {
    var userListItem = document.createElement("span");
    var userName = document.createTextNode(name);
    userListItem.className = "user-list-item";
    userListItem.appendChild(userName);

    return userListItem;
}
function createTypingElement(index) {
    var typingElement = document.createElement("span");
    typingElement.className = "typing-item-" + index;

    return typingElement;
}
function createTypingWrapper() {
    var typingWrapper = document.createElement("span");
    typingWrapper.className = "chat-typing-wrapper";

    return typingWrapper;
}

function timeoutFunction() {
    typing = false;
    socket.emit("typing", false);
}

setTimeout(function() {
    if(socket.disconnected) {
        $('body').html('<div class="chat-ban-notification">Nepadoru !<br> Jūs esate pažeidęs susirašinėjimo taisykles, todėl iš diskusijų buvot pašalintas ilgesniam laikui. Bandykite sugrįžti vėliau arba susisiekti su puslapio administratoriumi <i>info@pokemonas.lt</i>.<br> Geros dienos ! :)</div>');
    }
}, 7000);
