/**
 a simple demo for writing ABR rule
 this demo uses kalman-filter to estimated the next-bandwidth.
 */
var SimpleRule;

function SimpleRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');

    let context = this.context;

    function getMaxIndex(rulesContext) {
        // here you can get some informations aboit metrics for example, to implement the rule
        let metricsModel = MetricsModel(context).getInstance();
        let dashMetrics = DashMetrics(context).getInstance();

        var mediaType = rulesContext.getMediaInfo().type;
        var metrics = metricsModel.getReadOnlyMetricsFor(mediaType);
        var requests = dashMetrics.getHttpRequests(metrics);

        if (!metrics) {
            return SwitchRequest(context).create();
        }

        //next chunk index,next rule class,priority level
        //in this demo,this function always return the second chunk of next bitrate chunks.
        return SwitchRequest(context).create(1, SimpleRuleClass.__dashjs_factory_name, SwitchRequest.PRIORITY.STRONG);
    }

    const instance = {
        getMaxIndex: getMaxIndex
    };
    return instance;
}

SimpleRuleClass.__dashjs_factory_name = 'SimpleRule';
SimpleRule = dashjs.FactoryMaker.getClassFactory(SimpleRuleClass);

