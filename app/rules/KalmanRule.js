/**
 a simple demo for writing ABR rule
 this demo uses kalman-filter to estimated the next-bandwidth.
 */
var KalmanRule;

function KalmanRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');

    let context = this.context;

    var rate = 0.02;
    var pnoise = 10;
    var mnoise = 3;
    let kf_video = new KalmanFilter(rate, pnoise, mnoise);
    let kf_audio = new KalmanFilter(rate, pnoise, mnoise);

    function getBytesLength(request) {
        return request.trace.reduce((a, b) => a + b.b[0], 0);
    }

    function chooseBestbandwidth(rulesContext, calculatedBandwidth) {
        let dashManifest = DashManifestModel(context).getInstance();

        var bandwidths = [];
        var count = rulesContext.getMediaInfo().representationCount;
        var currentRepresentation = rulesContext.getRepresentationInfo();
        var currentBandwidth = dashManifest.getBandwidth(currentRepresentation);
        let streamController = StreamController(context).getInstance();
        let abrController = rulesContext.getAbrController();
        var mediaType = rulesContext.getMediaInfo().type;
        let current = abrController.getQualityFor(mediaType, streamController.getActiveStreamInfo());
        var q = SwitchRequest.NO_CHANGE;
        var p = SwitchRequest.PRIORITY.DEFAULT;
        var switchUpRatioSafetyFactor = 1.5;

        for (i = 0; i < count; i += 1) {
            bandwidths.push(rulesContext.getMediaInfo().bitrateList[i].bandwidth);
        }
        if (calculatedBandwidth <= currentBandwidth) {
            for (i = current - 1; i > 0; i -= 1) {
                if (bandwidths[i] <= calculatedBandwidth) {
                    break;
                }
            }
            q = i;
            p = SwitchRequest.PRIORITY.WEAK;
        } else {
            for (i = count - 1; i > current; i -= 1) {
                if (calculatedBandwidth > (bandwidths[i] * switchUpRatioSafetyFactor)) {
                    break;
                }
            }
            q = i;
            p = SwitchRequest.PRIORITY.STRONG;
        }
        return { q: q, p: p };
    }
    function getMaxIndex(rulesContext) {
        // here you can get some informations aboit metrics for example, to implement the rule
        let metricsModel = MetricsModel(context).getInstance();
        let dashMetrics = DashMetrics(context).getInstance();

        var mediaType = rulesContext.getMediaInfo().type;
        var metrics = metricsModel.getReadOnlyMetricsFor(mediaType);
        var requests = dashMetrics.getHttpRequests(metrics);


        var lastRequest = null;
        var currentRequest = null;

        if (!metrics) {
            return SwitchRequest(context).create();
        }

        // Get last valid request
        var i = requests.length - 1;
        while (i >= 0 && lastRequest === null) {
            currentRequest = requests[i];
            if (currentRequest._tfinish &&
                currentRequest.trequest &&
                currentRequest.tresponse &&
                currentRequest.trace &&
                currentRequest.trace.length > 0) {
                lastRequest = requests[i];
            }
            i--;
        }

        if (lastRequest === null) return SwitchRequest(context).create();
        if (lastRequest.type !== 'MediaSegment') return SwitchRequest(context).create();
        //this is the last total request time
        var totalTime = (lastRequest._tfinish.getTime() - lastRequest.trequest.getTime()) / 1000;
        var downloadTime = (lastRequest._tfinish.getTime() - lastRequest.tresponse.getTime()) / 1000;
        if (totalTime <= 0) return SwitchRequest(context).create();
        var totalBytesLength = getBytesLength(lastRequest);
        totalBytesLength *= 8;
        var totalbandwidth = totalBytesLength / totalTime;
        calculatedBandwidth = 0;
        var kf = kf_video;
        if (mediaType == 'audio') {
            kf = kf_audio;
        }
        var calculatedBandwidth = kf.update(totalbandwidth);
        console.log('estimated bandwidth:[', mediaType, ']', calculatedBandwidth / 1024, 'bps');
        if (isNaN(calculatedBandwidth)) return SwitchRequest(context).create();

        var ret = chooseBestbandwidth(rulesContext, calculatedBandwidth);
        //next chunk index,next rule class,priority level
        //return SwitchRequest(context).create(1, KalmanRuleClass.__dashjs_factory_name, SwitchRequest.PRIORITY.STRONG);
        return SwitchRequest(context).create(ret.q, KalmanRuleClass.__dashjs_factory_name, ret.p);
    }

    const instance = {
        getMaxIndex: getMaxIndex
    };
    return instance;
}

KalmanRuleClass.__dashjs_factory_name = 'KalmanRule';
KalmanRule = dashjs.FactoryMaker.getClassFactory(KalmanRuleClass);

