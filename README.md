# tinydash使用说明 #

tinydash是基于dash.js实现的dash client testbed，用户可以通过添加简单的脚本自定义码率调整策略。所有策略规则都在app/rules/文件夹中，默认有download ratio，kalman filter两个策略规则。
可以通过浏览
[https://1029.mythkast.net/tinydash/]
获取更多信息。

## 运行 ##

运行方式有多种多样，一般来说只需要拥有一个webserver即可运行。以下以nginx,nodejs,python作为简单的例子：

### nginx ###

安装nginx过程略，ubuntu或centos只需要简单的apt-get或者yum即可安装。
将项目目录中的所有内容移到/var/www/html中
使用浏览器输入localhost去访问该地址。

### node.js ###

安装nodejs过程略。
安装完node.js之后，使用以下指令安装http-server
```
npm install -g http-server
```
安装完毕后，在项目目录下输入http-server或./start.sh即可开启服务。
```
Starting up http-server, serving ./
Available on:
  http://127.0.0.1:8080
  http://192.168.11.101:8080
Hit CTRL-C to stop the server
```
随后使用浏览器去访问该地址。

### python ###

安装python过程略，现在看来似乎是必备工具。
在项目目录下使用该命令开启服务。

```python
python -m SimpleHTTPServer 8080
```

默认开启在8080端口，随后即可使用浏览器访问。

**start.sh开启的服务器默认使用https协议**

## 使用已有策略 ##
用户可在main.js中对已有策略进行尝试，位于doload函数内。例子主要提供了基于卡尔曼滤波的策略和下载比率的粗略，可通过修改注释的方式测试策略。
```js
if ($scope.customABRRulesSelected) {
            console.log('on custonABR');
            $scope.player.useDefaultABRRules(false);
            $scope.player.addABRCustomRule('qualitySwitchRules', 'SimpleRule', SimpleRule);
            /*
            $scope.player.addABRCustomRule('qualitySwitchRules', 'KalmanRule', KalmanRule);
            $scope.player.addABRCustomRule('qualitySwitchRules', 'DownloadRatioRule', DownloadRatioRule);
            */
        } else {
            $scope.player.useDefaultABRRules(true);
            $scope.player.removeABRCustomRule('SimpleRule');
            /*
            $scope.player.removeABRCustomRule('KalmanRule');
            $scope.player.removeABRCustomRule('DownloadRatioRule');
            */
        }
```

## 自定义策略 ##
自定义策略主要在app/rules/simpleRule.js中，核心函数是getMaxIndex，核心调整策略函数是SwitchRequest.

```js
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
```

其中，SwitchRequest如下所示

```js
SwitchRequest(context).create(quality, next_rule, priority);
```

where,

quality:选中的下一个切片index，simplerule例子中恒为第一个切片

next_rule:下一次使用的规则class，可以多个rule一起交叉使用

priority:此次调整的优先级，从weak到strong，有多个等级。

## Licensing and distribution ##

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.