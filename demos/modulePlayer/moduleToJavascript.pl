#!/usr/bin/perl

use strict;
use warnings;

# to get MOD/S3M/whatever files into javascript, they are encoded in base64
# and wrapped in a JavaScript var called 'module'

print "var module = window.atob('";

# base64 encode the file
my $filename = $ARGV[0];
my $base64sample = `base64 -i $filename`;
chomp $base64sample;
print $base64sample;

print "');\n";
