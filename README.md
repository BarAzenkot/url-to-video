
# URL to MP4

A generator that gets a JSON File with url, makes a screenshot, convert it to a 10 seconds video and returns its path.





## Usage

if you wish to invoke the lambda function run:

```cURL
curl --location --request POST 'https://n22pwco6a4.execute-api.eu-west-1.amazonaws.com/bigvu-url-to-video-lambda' \
--header 'Content-Type: application/json' \
--data-raw '{
  "url": "https://bigvu.tv"
}'
```

you can change the url to whatever you wish.
## Tech Stack


**Server:** aws-sdk, puppeteer-core, fluent-ffmpeg, @sparticuz/chrome-aws-lambda.

**Cloud:** API-gateway, lambda, IAM, s3 bucket. 

