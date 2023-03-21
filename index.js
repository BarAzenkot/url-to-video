const AWS = require("aws-sdk");
const chromium = require("@sparticuz/chrome-aws-lambda");
const ffmpeg = require("fluent-ffmpeg");
const uuid = require("uuid");
const fs = require("fs");

const bucket = "bigvu-bar-azenkot-mp4-bucket";

const s3 = new AWS.S3();

const badRequestResponse = {
  statusCode: 400,
  body: "invalid url",
};

const isValidURL = (url) => {
  try {
    const parsedURL = new URL(url);
    return ["http:", "https:"].includes(parsedURL.protocol);
  } catch {
    return false;
  }
};

const makeVideo = async (url) => {
  const screenshotPath = "/tmp/screenshot.png";
  const videoPath = "/tmp/video.mp4";

  // Check if url is valid
  if (!isValidURL(url)) {
    return badRequestResponse;
  }

  // Launch Puppeteer and browser
  const executablePath = await chromium.executablePath;
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  // Navigate to the website
  const page = await browser.newPage();
  await page.goto(url);

  // Take a screenshot
  const screenshot = await page.screenshot({ type: "png" });
  fs.writeFileSync(screenshotPath, screenshot);
  const imageData = fs.readFileSync(screenshotPath);

  // Close the browser when done
  await browser.close();

  // Create a video
  ffmpeg()
    .input(fs.createReadStream(screenshotPath))
    .loop(Infinity)
    .duration(10)
    .videoCodec("libx264")
    .outputOptions("-pix_fmt", "yuv420p")
    .outputOptions("-movflags", "+faststart")
    .outputOptions("-vf", "scale=1280:-2")
    .outputFormat("mp4")
    .on("error", (e) => {
      console.error("An error occurred: " + e.message);
    })
    .on("end", () => {
      console.log("Video converting has finished successfully!");
    })
    .pipe(fs.createWriteStream(videoPath), { end: true });

  // Upload video
  const key = `${uuid.v4()}.png`;
  await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: imageData,
      ContentType: "image/x-png",
    })
    .promise();

  // Return video path
  return {
    statusCode: 200,
    body: JSON.stringify({
      path: `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`,
    }),
  };
};

exports.handler = async (event) => {
  return await makeVideo(JSON.parse(event.body).url);
};
