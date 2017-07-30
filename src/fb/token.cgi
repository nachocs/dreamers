#!/usr/bin/perl

	print fb_request("CAACLoZCVNZC1gBAG4oMO1eMV5NZC6bwoD0AssdRz57QvjDYDqIwIAYoWU1iLyLAJx2ZAbsZAxXCuQ2WJwuuNq3aSztaZAqkA1Tkyq9XxuqplTcFAhWI3WTgwPtaCwamy7Mf0UvpeUV3ky0Viqe5qSwf1NO1HZByZAZAL7AwZBKOo3BHQt1ZA8Ps61jRvSgideIIuc4ZD");

	sub fb_request{
		my ($access_token) = @_;

		use LWP;
		my $ua = LWP::UserAgent->new(timeout => 60);
		$ua->agent("Mozilla/4.0 (compatible; MSIE 5.5; Windows 98)");


		my $app_secret = "7d50f1fd7ab44a5b5cdd3426617b2c7d";
		my $app_id = "153536311459672";
		my $url = "https://graph.facebook.com/debug_token?input_token=$access_token&access_token=$app_id|$app_secret";
		my $request = HTTP::Request->new( GET => $url );
		my $response = $ua->request( $request );

		unless ($response->is_success){
			return "no se ha podido cargar $url. Razón: $!<br>\n";		
		} else {
			$content = $response->content;
			return $content;

		}

	}
