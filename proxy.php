<?php
// Set your URL
$url = 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2Frymixxx%2Fmy-pair-of-shoes-volume-87%2F';

// Get the content
$content = file_get_contents($url);

// Set the correct headers
header('Content-Type: text/html');
header('Access-Control-Allow-Origin: *');

// Output the content
echo $content;
?>
