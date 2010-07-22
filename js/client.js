function longPoll_feed () {
	//make another request
	$.ajax({
			cache: false,
			dataType: 'json',
			type: "GET",
			url: "/real_time_feed",
			error: function () {
				//don't flood the servers on error, wait 10 seconds before retrying
				setTimeout(longPoll_feed, 10*1000);
			},
			success: function (json) {
				display_event(json);
				
				//if everything went well, begin another request immediately
				//the server will take a long time to respond
				//how long? well, it will wait until there is another message
				//and then it will return it to us and close the connection.
				//since the connection is closed when we get data, we longPoll again
				longPoll_feed();
			}
		});
}

function display_event(json){
	$('#feed_holder').prepend('<hr />');
	
	switch(json[0].type){
		case 'message':
			$('#feed_holder').prepend('<p>'+json[0].content+'</p>');
		break;
		
		case 'google_map':
		    myLatlng = new google.maps.LatLng(json[0].content.lat, json[0].content.long);
		    myOptions = {
		      zoom: 15,
		      center: myLatlng,
		      mapTypeId: google.maps.MapTypeId.ROADMAP
		    }
		
			$('#feed_holder').prepend('<div class="map" style="width:300px;height:300px;"></div>');
			
		    map = new google.maps.Map($('.map:first')[0], myOptions);
		break;
		
		case 'youtube':
			video_id = json[0].content.url;
			video_id = video_id.substring(video_id.indexOf('?v=')+3,video_id.length);
		
			$('#feed_holder').prepend('<object width="575" height="385"><param name="movie" value="http://www.youtube.com/v/'+video_id+'&amp;hl=en_US&amp;fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'+video_id+'&amp;hl=en_US&amp;fs=1" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="575" height="385"></embed></object>');
		break;
	}
}

$(document).ready(function() {
	//begin listening for updates right away
	longPoll_feed();
});