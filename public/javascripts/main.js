$(document).ready(function() {
    $('.team-item').click(function() {
        var $element = $(this);
        var width = Math.round($(this).width() / $(window).width() *100);
        if(width < 100) {
            var i = setInterval(function(){
                // do your thing
                $element.css({
                    'width': width + '%'
                });
                $element.siblings('a').css({
                    width: (100 - width) / 2 + '%'
                });
                width++;
                if(width >= 100) {
                    $element.siblings('a').remove();
                    $('.city-selection').fadeIn();
                    $element.fadeOut(500);
                    $('body').css({
                        'background-image': $element.css('background-image'),
                        'background-size': '100% 100%'
                    });
                    $element.remove();
                    
                    clearInterval(i);
                }
            }, 10);
            createCookie('team',$element.attr('id'),1);
        }
    });
    $('.city-selection button').click(function(e) {
        e.preventDefault();
        var self = this;
        $.ajax({
            type: 'GET',
            url: '/form',
            success: function(data) {
                $('.city-selection').html(data);
                createCookie('city',$(self).attr('id'),1);
            }
        });
    });
    $(this).on('click','#login', function(e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '/login',
            success: function(data) {
                $('.city-selection').html(data);
            }
        }).done(function(data){
            console.log(data);
        });
    });
    $(this).on('click','#home', function() {
        $.ajax({
            type: 'GET',
            url: '/form',
            success: function(data) {
                $('.city-selection').html(data);
            }
        });
    });
    $(this).on('click','#signup', function(e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '/signup',
            success: function(data) {
                $('.city-selection').html(data);
            }
        });
    });
    // $(this).on('submit','#loginIn', function(e) {
    //         $.ajax({
    //             type: 'POST',
    //             url: '/login',
    //             data: $('#loginIn').serialize(),
    //             success: function(data) {
    //                 $('.city-selection').html(data);
    //             }
    //         });
    //     return false;
    // });
});

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}