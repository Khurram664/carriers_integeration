var winston = require('winston');
require('winston-daily-rotate-file');

var transport = new winston.transports.DailyRotateFile({
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '28d',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

transport.on('rotate', function (oldFilename, newFilename) {
    // do something fun
});

const logger = winston.createLogger({
    transports: [
        transport
    ]
});

const InfoLogger = (message) => {
    console.log('in infologger');
    console.log(logger);
    console.log(message);

    try {
        logger.info(message);
    } catch (e) {
        console.log(e);
    }
}
module.exports.InfoLogger = InfoLogger;

