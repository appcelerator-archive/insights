// #TODO: purposefully verbose (help review how data is processed), but not abstracted well enough
// there is too much reliance on assumptions and static names

var processor = { 
    types: [
        // 0
        {
            name: 'sessions_geo',
            method: processCurrentSessionsData
        },
        // 1
        {
            name: 'acspushdev_platform',
            method: processPushDevicesData
        },
        // 2
        {
            name: 'apmcrash_platform',
            method: processCrashesData
        },
        // 3
        {
            name: 'apmunique_platform',
            method: processUniqueCrashesData
        },
        // 4
        {
            name: 'installs_platform',
            method: processInstallsData
        },
        // 5
        {
            name: 'sessions_platform',
            method: processSessionsData
        },
        // 6
        {
            name: 'sessionsavg_platform',
            method: processSessionLengthData
        },
        // 7
        {
            name: 'u_platform',
            method: processUniqueData
        },
        {
            name: 'funnel',
            method: processFunnelData
        }
    ]
};

var state = {
    processes: {
        count: 0
    },
    events: {
        onUpdate: function() {},
        onComplete: function() {}
    },
    data: [], // we know that 0 index is current sessions... need to iterate through 2, 3 TODO: more abstraction
    processedData: {}
}

var lib = {
    number: require('client/number')()
};

// #TODO: move to number lib
function getTotalFromArrElements(arr) {
    var _arr   = arr || [],
        _total = 0;

    for (var i = 0, il = _arr.length; i < il; i++) {
        if (arr[i] && !isNaN(arr[i])) {
            _total += arr[i];
        }
    }

    return _total;
}

// #TODO: move to time lib
function getTotalDaysInMonth() {
    var _now = new Date();
    
    return (new Date(_now.getYear(), _now.getMonth(), 0)).getDate();
}

// setup our processed data object
// TODO: we will probably want to move to DB for persistence, but 
// it will be better to wait to avoid potential migrations due to
// app updates early on...
function prepareProcessedData() {
    // #BUG: Had to add resourcesDirectory for Android...
    state.processedData = JSON.parse(Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + 'common/data-base.json').read().text);
}

function reset() {
    state.data.length = 0;
    state.data = [];
    state.processes.count = 0;
    state.events.onComplete = function() {};
    state.processedData = {};
}

// ##### GENERIC PROCESS UTILS - START
// null will be the value for N/A
function processDaysData(data, selectedProcessedData, selectedMetric) {
    var _dailyTotalsArrLength = data.dailyTotals.length;

    var _todayTotal     = 0,
        _yesterdayTotal = 0,
        _crashTotal     = 0;

    for (var dtv = _dailyTotalsArrLength - 7, dtvi = 0; dtv < _dailyTotalsArrLength; dtv++) {
        // #TODO: this should be processed by type, not metric names (which will change)...
        switch (selectedMetric) {
            case 'installs':
                // get the straight total for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv];
                break;
            case 'pushDevices':
                // get the straight total for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv];
                break;
            case 'sessionLength':
                //  get the straight total for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv] * 1000; // sec to ms
                break;
            case 'sessions':
                // get the straight total for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv];
                break;
            case 'crashFrequency':
                // (avg session length * sessions) / crashes, for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = (data.dailyTotals[dtv] === 0 || !data.dailyTotals[dtv]) ? null : (state.data[1].data[processor.types[6].name].dailyTotals[dtv] * state.data[1].data[processor.types[5].name].dailyTotals[dtv]) / data.dailyTotals[dtv];
                break;
            case 'sessionsOverCrashes':
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = (data.dailyTotals[dtv] === 0 || !data.dailyTotals[dtv]) ? null : state.data[1].data[processor.types[5].name].dailyTotals[dtv] / data.dailyTotals[dtv];
                break;
            case 'uniqueCrashes':
                // take total crashes for the day and multiply by avg unique
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = state.data[1].data[processor.types[2].name].dailyTotals[dtv] * data.dailyTotals[dtv];
                break;
            case 'retentionRate':
                // (sum of unique devices, today - sum of installs, today) / sum of unique devices, yesterday
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = (data.dailyTotals[dtv - 1] === 0 || !data.dailyTotals[dtv - 1]) ? null : ((data.dailyTotals[dtv] - state.data[1].data[processor.types[4].name].dailyTotals[dtv]) / data.dailyTotals[dtv - 1]) * 100;
                // #APPTS-4032: don't allow to go below 0...
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = (selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] < 0) ? 0 : selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi];
                break;
            case 'uniqueDevices':
                // get the straight total for the day
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv];
                break;
            default:
                selectedProcessedData.metrics[selectedMetric].weekByDays[dtvi] = data.dailyTotals[dtv];
                break;
        }

        dtvi ++;
    }

    // set today and yesterday totals for 24hr trend
    // we assume weekByDays length is 7
    _todayTotal     = selectedProcessedData.metrics[selectedMetric].weekByDays[6],
    _yesterdayTotal = selectedProcessedData.metrics[selectedMetric].weekByDays[5];

    // calculate last 7 days
    // #TODO: this should be processed by type, not metric names (which will change)
    if (_dailyTotalsArrLength > 0) {
        switch (selectedMetric) {
            case 'installs':
                // calculate total from days of current week
                selectedProcessedData.metrics[selectedMetric].last7Days = getTotalFromArrElements(selectedProcessedData.metrics[selectedMetric].weekByDays);
                break;
            case 'pushDevices':
                // calculate change between current day and last day of previous week
                selectedProcessedData.metrics[selectedMetric].last7Days = data.dailyTotals[_dailyTotalsArrLength - 1] - data.dailyTotals[_dailyTotalsArrLength - 8];
                break;
            case 'sessionLength':
                // the avg will be based on total session length / total sessions 
                selectedProcessedData.metrics[selectedMetric].last7Days = lib.number.getAvg(selectedProcessedData.metrics[selectedMetric].weekByDays);
                break;
            case 'sessions':
                // calculate total from days of current week
                selectedProcessedData.metrics[selectedMetric].last7Days = getTotalFromArrElements(selectedProcessedData.metrics[selectedMetric].weekByDays);
                // update session totals for map
                state.processedData.sessions.yesterday                  = data.dailyTotals[_dailyTotalsArrLength - 2] || 0;
                state.processedData.sessions.today                      = data.dailyTotals[_dailyTotalsArrLength - 1] || 0;
                break;
            case 'crashFrequency':
                // to avoid duplicate calculation, this will be set in the processCrashesData method...
                // also... this calculation is for 3 weeks, not last 7 days...
                // _crashTotal = getTotalFromArrElements(data.dailyTotals);
                // (avg session length * sessions) / crashes, for entire week
                // selectedProcessedData.metrics[selectedMetric].last7Days = (_crashTotal === 0 || !_crashTotal) ? null : (getTotalFromArrElements(state.data[1].data[processor.types[6].name].dailyTotals) * getTotalFromArrElements(state.data[1].data[processor.types[5].name].dailyTotals)) / _crashTotal;
                break;
            case 'sessionsOverCrashes':
                // we want the average from the current week
                selectedProcessedData.metrics[selectedMetric].last7Days = lib.number.getAvg(selectedProcessedData.metrics[selectedMetric].weekByDays);
                break;
            case 'uniqueCrashes':
                // calculate total from days of current week
                selectedProcessedData.metrics[selectedMetric].last7Days = getTotalFromArrElements(selectedProcessedData.metrics[selectedMetric].weekByDays);
                break;
            case 'retentionRate':
                // we want the average from the current week
                selectedProcessedData.metrics[selectedMetric].last7Days = lib.number.getAvg(selectedProcessedData.metrics[selectedMetric].weekByDays);
                // #APPTS-4032: don't allow to go below 0...
                selectedProcessedData.metrics[selectedMetric].last7Days = (selectedProcessedData.metrics[selectedMetric].last7Days < 0) ? 0 : selectedProcessedData.metrics[selectedMetric].last7Days;
                break;
            case 'uniqueDevices':
                // calculate total from days of current week
                selectedProcessedData.metrics[selectedMetric].last7Days = getTotalFromArrElements(selectedProcessedData.metrics[selectedMetric].weekByDays);
                 break;
            default: break;
        }
    } else {
        selectedProcessedData.metrics[selectedMetric].last7Days = 0;
    }

    // set 24hr direction
    if (_todayTotal === _yesterdayTotal) {
        selectedProcessedData.metrics[selectedMetric].direction = 0;
    } else {
        selectedProcessedData.metrics[selectedMetric].direction = (_todayTotal > _yesterdayTotal) ? 1 : -1;
    }
}

function processPlatformData(data, selectedProcessedData, selectedMetric) {
    var _platformColArrLength  = data.chartData.columns.length,
        _platformDataArrLength = data.chartData.data.length,
        _chartDataArrLength    = null;

    var _platformTotal        = 0,
        _platformArr          = [],
        _secondaryPlatformArr = []; // for when we need to calculate averages...

    var _crashFrequencyArr = {
        avgSessionLength: [],
        sessions: [],
        crashes: []
    };

    var _crashTotal = 0;

    // first loop through chartData > columns to get platform names
    for (var ce = 0, cel = _platformColArrLength; ce < cel; ce++) {
        // then loop through processed data
        for (var ppe = 0, ppel = selectedProcessedData.metrics[selectedMetric].platform.length; ppe < ppel; ppe++) {
            // match platform name
            if (data.chartData.columns[ce] === selectedProcessedData.metrics[selectedMetric].platform[ppe].name) {
                // then loop through chartData > data to add up values, unless it's certain metrics (this could be done in the loop to avoid additional switch case)
                if (selectedMetric !== 'pushDevices') {
                    // we only want to current week here
                    for (var cdv = _platformDataArrLength - 7, cdvi = 0; cdv < _platformDataArrLength; cdv++) {
                        // add current total; timestamps are at 0 index
                        // #TODO: this should be processed by type, not metric names (which will change)
                        switch (selectedMetric) {
                            case 'installs':
                                // add up all installs for the week
                                _platformTotal += data.chartData.data[cdv][ce + 1];
                                break;
                            case 'sessionLength':
                                // add to arr so that we can calculate avg
                                _platformArr.push(lib.number.processForValid(data.chartData.data[cdv][ce + 1] * 1000, 0)); // convert from seconds to milliseconds
                                // _platformTotal += data.chartData.data[cdv][ce + 1] * 1000; 
                                break;
                            case 'sessions':
                                // add up all sessions for the week
                                _platformTotal += data.chartData.data[cdv][ce + 1];
                                break;
                            case 'crashFrequency':
                                // (avg session length * sessions) / crashes, for week
                                // push to arrs to be processed further down...
                                _crashFrequencyArr.avgSessionLength.push(lib.number.processForValid(state.data[1].data[processor.types[6].name].chartData.data[cdv][ce + 1] * 1000, 0));
                                _crashFrequencyArr.sessions.push(state.data[1].data[processor.types[5].name].chartData.data[cdv][ce + 1]);
                                _crashFrequencyArr.crashes.push(data.chartData.data[cdv][ce + 1]);
                                break;
                            case 'sessionsOverCrashes':
                                // (total sessions / total crashes)
                                _secondaryPlatformArr.push((data.chartData.data[cdv][ce + 1] === 0 || !data.chartData.data[cdv][ce + 1]) ? null : lib.number.processForValid(state.data[1].data[processor.types[5].name].chartData.data[cdv][ce + 1] / data.chartData.data[cdv][ce + 1], null));
                                break;
                            case 'uniqueCrashes':
                                // add up all unique crashes for the week by taking total crashes multiplied by (% unique crashes / 100) we get the percent, not fraction
                                _platformTotal += (data.chartData.data[cdv][ce + 1] === 0) ? 0 : lib.number.processForValid(state.data[1].data[processor.types[2].name].chartData.data[cdv][ce + 1] * (data.chartData.data[cdv][ce + 1] / 100), 0);
                                break;
                            case 'retentionRate':
                                // retention rate can not be displayed on the donut graph
                                _platformTotal = 0;
                                break;
                            case 'uniqueDevices':
                                // add up all avg unique devices for the week
                                _platformTotal += data.chartData.data[cdv][ce + 1];
                                break;
                            default:
                                _platformTotal += data.chartData.data[cdv][ce + 1];
                                break;
                        }
                    }
                } else {
                    // for metrics that can not be processed cumulatively
                    // #TODO: this should be processed by type, not metric names (which will change)
                    switch (selectedMetric) {
                        case 'pushDevices':
                            _chartDataArrLength = state.data[1].data[processor.types[1].name].chartData.data.length;

                            // straight total for the current day...
                            _platformTotal = state.data[1].data[processor.types[1].name].chartData.data[_chartDataArrLength - 1][ce + 1];
                            break;
                        default: break;
                    }
                }

                // post-process
                // #TODO: this should be processed by type, not metric names (which will change)
                switch (selectedMetric) {
                    case 'crashFrequency':
                        _crashTotal = getTotalFromArrElements(_crashFrequencyArr.crashes);

                        // (avg session length * sessions) / crashes, for week
                        _platformTotal = (_crashTotal === 0 || !_crashTotal) ? null :  (lib.number.getAvg(_crashFrequencyArr.avgSessionLength) * getTotalFromArrElements(_crashFrequencyArr.sessions)) / _crashTotal;
                        break;
                    case 'sessionLength':
                        // we want the average for the entire week
                        _platformTotal = lib.number.getAvg(_platformArr);
                        break;
                    case 'uniqueCrashes':
                        _platformTotal = Math.round(_platformTotal);
                        break;                      
                    case 'sessionsOverCrashes':
                        // we want the average for the entire week
                        Ti.API.info('Sessions / Crashes Platform Arr:');
                        Ti.API.info(_secondaryPlatformArr);
                        _platformTotal = lib.number.getAvg(_secondaryPlatformArr);
                        break;
                    default: break;
                }

                selectedProcessedData.metrics[selectedMetric].platform[ppe].total = _platformTotal;

                _crashFrequencyArr.avgSessionLength.length = 0,
                _crashFrequencyArr.sessions.length         = 0,
                _crashFrequencyArr.crashes.length          = 0,
                _platformArr.length                        = 0,
                _secondaryPlatformArr.length               = 0;
                
                _crashFrequencyArr.avgSessionLength = [],
                _crashFrequencyArr.sessions         = [],
                _crashFrequencyArr.crashes          = [],
                _platformArr                        = [],
                _secondaryPlatformArr               = [];
                                
                _crashTotal    = 0,
                _platformTotal = 0; // reset total
            }
        }
    }
}

function processMonthAndQuarterData(data, selectedProcessedData, selectedMetric) {
    var _dailyTotalsArrLength        = data.dailyTotals.length,
        _lastQuarterArr              = [], // selected metric
        _secondaryLastQuarterArr     = [], // we may need to get data from a secondary data set
        _secondaryThisQuarterArr     = [], // we need this for retention rate (installs)
        _tertiaryThisQuarterArr      = [],
        _tertiaryLastQuarterArr      = [], // we need this for retention rate (installs)
        _lastQuarterTotal            = 0, // we need to substract from the total so that we don't get composite 2 quarters; selected metric
        _secondaryLastQuarterTotal   = 0, // we need to substract from the secondary total so that we don't get composite 2 quarters
        _secondaryThisQuarterTotal   = 0, // wee need this for retention rate (installs)
        _tertiaryThisQuarterTotal    = 0,
        _tertiaryLastQuarterTotal    = 0, // wee need this for retention rate (installs)
        _totalMonthsInCurrentQuarter = 0; // for getting quarter average (e.g. Avg Session Length), we must offset by number of months;

    // a lot of processing is done with crash frequency...
    // to avoid confusion, generating specific arrs...
    var _crashFrequencyTotals = {
        thisQuarter: {
            avgSessionLengthArr: [],
            sessions: 0
        }
    };

    // first push last 3 quarters to arr that we will need to offset total value
    for (var i = 0; i < 3; i++) {
        if (data.dailyTotals[i]) {
            _lastQuarterArr.push(data.dailyTotals[i]);
        }
    }

    // get total for last quarter
    _lastQuarterTotal = getTotalFromArrElements(_lastQuarterArr);

    switch (selectedMetric) {
        case 'installs':
            // current quarter (straight total)
            selectedProcessedData.metrics[selectedMetric].range[0].total = data.total - _lastQuarterTotal;

            // current month (straight total)
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1];
            break;
        case 'pushDevices':
            // current quarter (change over quarter; end of previous quarter month and current month)
            selectedProcessedData.metrics[selectedMetric].range[0].total = data.dailyTotals[_dailyTotalsArrLength - 1] - data.dailyTotals[2]; // last quarter end month is always at index 2; arr is 4-6 elements, 1-3 last quarter

            // current month (change over month; end of previous month and current month)
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1] - data.dailyTotals[_dailyTotalsArrLength - 2];
            break;
        case 'sessionLength':
            // first push current quarter totals (Avg Session Length)
            for (var t = 3; t < 6; t++) {
                if (data.dailyTotals[t]) {
                    _secondaryThisQuarterArr.push(data.dailyTotals[t]);
                }
            }

            // _secondaryThisQuarterTotal = getTotalFromArrElements(_secondaryThisQuarterTotal);

            // current quarter
            // total (current quarter) / number of months in quarter
            // _totalMonthsInCurrentQuarter = _dailyTotalsArrLength - 3;
            // selectedProcessedData.metrics[selectedMetric].range[0].total = (_secondaryThisQuarterTotal - _lastQuarterTotal) / _totalMonthsInCurrentQuarter;

            // current month
            // total (current month) / number of days in current month
            // selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1] / getTotalDaysInMonth();

            // current quarter (avg of current quarter months)
            selectedProcessedData.metrics[selectedMetric].range[0].total = lib.number.getAvg(_secondaryThisQuarterArr);

            // current month (straight total)
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1];
            break;
        case 'sessions':
            // current quarter (straight total)
            selectedProcessedData.metrics[selectedMetric].range[0].total = data.total - _lastQuarterTotal;
            
            // this should never be negative, but could be if the values are incorrect
            if (selectedProcessedData.metrics[selectedMetric].range[0].total < 0) {
                Ti.API.debug('Session total is less than 0 for quarter. Data should be checked...');
                selectedProcessedData.metrics[selectedMetric].range[0].total = 0;
            }

            // current month (straight total)
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1];

            // this should never be negative, but could be if the values are incorrect
            if (selectedProcessedData.metrics[selectedMetric].range[1].total < 0) {
                Ti.API.debug('Session total is less than 0 for month. Data should be checked');
                selectedProcessedData.metrics[selectedMetric].range[1].total = 0;
            }

            break;
        case 'crashFrequency':
            // get totals for avg session length, this quarter
            for (var tavl = 3; tavl < 6; tavl ++) {
                if (state.data[2].data[processor.types[6].name].dailyTotals[tavl]) {
                    _crashFrequencyTotals.thisQuarter.avgSessionLengthArr.push(state.data[2].data[processor.types[6].name].dailyTotals[tavl]);
                }
            }

            // get totals for sessions, this quarter
            for (var ts = 3; ts < 6; ts++) {
                if (state.data[2].data[processor.types[5].name].dailyTotals[ts]) {
                    _crashFrequencyTotals.thisQuarter.sessions += state.data[2].data[processor.types[5].name].dailyTotals[ts];
                }
            }

            // current quarter (avg session length * sessions) / crashes
            selectedProcessedData.metrics[selectedMetric].range[0].total = ((data.total - _lastQuarterTotal) === 0) ? null : (lib.number.getAvg(_crashFrequencyTotals.thisQuarter.avgSessionLengthArr) * _crashFrequencyTotals.thisQuarter.sessions) / (data.total - _lastQuarterTotal);

            // current month (avg session length * sessions) / crashes
            selectedProcessedData.metrics[selectedMetric].range[1].total = (!data.dailyTotals[_dailyTotalsArrLength - 1] || data.dailyTotals[_dailyTotalsArrLength - 1] === 0) ? null : (state.data[2].data[processor.types[6].name].dailyTotals[state.data[2].data[processor.types[6].name].dailyTotals.length - 1] * state.data[2].data[processor.types[5].name].dailyTotals[state.data[2].data[processor.types[5].name].dailyTotals.length - 1]) / data.dailyTotals[_dailyTotalsArrLength - 1];
            break;
        case 'sessionsOverCrashes':
            // first push last 3 quarters to secondary (sessions) arr that we will need to offset total value
            for (var i = 0; i < 3; i++) {
                _secondaryLastQuarterArr.push(state.data[2].data[processor.types[5].name].dailyTotals[i]);
            }

            // get total for last quarter (secondary - sessions)
            _secondaryLastQuarterTotal = getTotalFromArrElements(_secondaryLastQuarterArr);

            // current quarter (sessions / crashes)
            selectedProcessedData.metrics[selectedMetric].range[0].total = ((data.total - _lastQuarterTotal) === 0) ? null : (state.data[2].data[processor.types[5].name].total - _secondaryLastQuarterTotal) / (data.total - _lastQuarterTotal);

            // current month
            selectedProcessedData.metrics[selectedMetric].range[1].total = (!data.dailyTotals[_dailyTotalsArrLength - 1] || data.dailyTotals[_dailyTotalsArrLength - 1] === 0) ? null : state.data[2].data[processor.types[5].name].dailyTotals[state.data[2].data[processor.types[5].name].dailyTotals.length - 1] / data.dailyTotals[_dailyTotalsArrLength - 1];
            break;
        case 'uniqueCrashes':
            // current quarter
            // must get total crashes * unique for each individual month and then add total
            
            // first, we need to loop through the current quarter months and push total crashes * % unique crashes for each month...
            // we can then add the arr and get our final quarter value
            for (var s = 3; s < 6; s++) {
                _secondaryThisQuarterArr.push(state.data[2].data[processor.types[2].name].dailyTotals[s] * state.data[2].data[processor.types[3].name].dailyTotals[s]);
            }

            selectedProcessedData.metrics[selectedMetric].range[0].total = getTotalFromArrElements(_secondaryThisQuarterArr);

            // current month (straight total)
            // this is a little easier... just take total from current month * % unique for month
            selectedProcessedData.metrics[selectedMetric].range[1].total = state.data[2].data[processor.types[2].name].dailyTotals[_dailyTotalsArrLength - 1] * state.data[2].data[processor.types[3].name].dailyTotals[_dailyTotalsArrLength - 1];
            break;
        case 'retentionRate':
            for (var s = 0; s < 3; s++) {
                // first push last 3 quarters to secondary (unique devices) arr that we will need to divide with
                if (state.data[2].data[processor.types[7].name].dailyTotals[s]) {
                    // unique devices
                    _secondaryLastQuarterArr.push(state.data[2].data[processor.types[7].name].dailyTotals[s]);
                }
            }

            // then push current quarter totals (installs, unique devices)
            for (var t = 3; t < 6; t++) {
                // intalls
                if (state.data[2].data[processor.types[4].name].dailyTotals[t]) {
                    _secondaryThisQuarterArr.push(state.data[2].data[processor.types[4].name].dailyTotals[t]);
                }

                // unique devices
                if (state.data[2].data[processor.types[7].name].dailyTotals[t]) {
                    _tertiaryThisQuarterArr.push(state.data[2].data[processor.types[7].name].dailyTotals[t]);
                }
            } 

            _secondaryLastQuarterTotal = getTotalFromArrElements(_secondaryLastQuarterArr),   // last quarter unique devices
            _secondaryThisQuarterTotal = getTotalFromArrElements(_secondaryThisQuarterArr), // this quarter installs
            _tertiaryThisQuarterTotal  = getTotalFromArrElements(_tertiaryThisQuarterArr);    // this quarter unique devices

            // current quarter
            // (sum of unique devices, this quarter - sum of installs, this quarter) / sum of unique devices, last quarter
            selectedProcessedData.metrics[selectedMetric].range[0].total =  (_secondaryLastQuarterTotal === 0) ? null : ((_tertiaryThisQuarterTotal - _secondaryThisQuarterTotal) / _secondaryLastQuarterTotal) * 100;            
            
            // current month
            // (sum of unique devices, this month - sum of installs, this month) / sum of unique devices, last month
            selectedProcessedData.metrics[selectedMetric].range[1].total = (!data.dailyTotals[_dailyTotalsArrLength - 2] || data.dailyTotals[_dailyTotalsArrLength - 2] === 0) ? null : ((data.dailyTotals[_dailyTotalsArrLength - 1] - state.data[2].data[processor.types[4].name].dailyTotals[state.data[2].data[processor.types[4].name].dailyTotals.length - 1]) / data.dailyTotals[_dailyTotalsArrLength - 2]) * 100;
            
            // #APPTS-4032: don't allow to go below 0...
            selectedProcessedData.metrics[selectedMetric].range[0].total = (selectedProcessedData.metrics[selectedMetric].range[0].total < 0) ? 0 : selectedProcessedData.metrics[selectedMetric].range[0].total;
            selectedProcessedData.metrics[selectedMetric].range[1].total = (selectedProcessedData.metrics[selectedMetric].range[1].total < 0) ? 0 : selectedProcessedData.metrics[selectedMetric].range[1].total;
            break;
        case 'uniqueDevices':
            // push current quarter totals (unique devices)
            for (var t = 3; t < 6; t++) {
                // unique devices
                if (state.data[2].data[processor.types[7].name].dailyTotals[t]) {
                    _secondaryThisQuarterArr.push(state.data[2].data[processor.types[7].name].dailyTotals[t]);
                }
            }

            // current quarter (straight total)
            selectedProcessedData.metrics[selectedMetric].range[0].total = getTotalFromArrElements(_secondaryThisQuarterArr);

            // current month (straight total)
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1];
            break;

            // OLDER AVG CALC
            // first push current quarter totals (Avg Session Length)
            // for (var t = 3; t < 6; t++) {
            //     _secondaryThisQuarterArr.push(data.dailyTotals[t]);
            // } 

            // _secondaryThisQuarterTotal = getTotalFromArrElements(_secondaryThisQuarterTotal);

            // current quarter
            // total (current quarter) / number of months in quarter
            // _totalMonthsInCurrentQuarter = _dailyTotalsArrLength - 3;
            // selectedProcessedData.metrics[selectedMetric].range[0].total = (_secondaryThisQuarterTotal - _lastQuarterTotal) / _totalMonthsInCurrentQuarter;

            // current month
            // total (current month) / number of days in current month
            // selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1] / getTotalDaysInMonth();
            break;
        default:
            // current quarter
            selectedProcessedData.metrics[selectedMetric].range[0].total = data.total;

            // current month
            selectedProcessedData.metrics[selectedMetric].range[1].total = data.dailyTotals[_dailyTotalsArrLength - 1];
            break;
    }

    if (isNaN(selectedProcessedData.metrics[selectedMetric].range[0].total)) {
        selectedProcessedData.metrics[selectedMetric].range[0].total = 0;
    }

    if (isNaN(selectedProcessedData.metrics[selectedMetric].range[1].total)) {
        selectedProcessedData.metrics[selectedMetric].range[1].total = 0;
    }
}
// ##### GENERIC PROCESS UTILS - END

// only update the current sessions... today and yesterday update in processSessionsData
// UI will count current array length to render current value
function processCurrentSessionsData() {
    var _data   = state.data[0].data[processor.types[0].name].points,
        _points = [];

    state.processedData.sessions.currentTotal = 0;

    for (var si = 0, sl = _data.length; si < sl; si ++ ) {
        _points.push({
            lat: _data[si].lat,
            lng: _data[si].lng,
            count: _data[si].count
        });

        state.processedData.sessions.current = _points;
        state.processedData.sessions.currentTotal += _data[si].count;
    }

    
}

// pushDevices
function processPushDevicesData() {
    // month: change over month; end of previous month and current month
    // quarter: change over quarter; end of previous quarter month and current month
    // day: change over day; end of previous day and current day
    // last 7 days: change over day; end of last day of previous week and current day
    // day graph: change; same as last 7 days

    processMonthAndQuarterData(state.data[2].data[processor.types[1].name], state.processedData.categories.acquisition, 'pushDevices');
    processDaysData(state.data[1].data[processor.types[1].name], state.processedData.categories.acquisition, 'pushDevices');
    processPlatformData(state.data[1].data[processor.types[1].name], state.processedData.categories.acquisition, 'pushDevices');
}

function processCrashesData() {
    var _totals = {
        sessionLength: {
            lastWeek: [],
            thisWeek: []
        },
        sessions: {
            lastWeek: 0,
            thisWeek: 0
        },
        crashes: {
            lastWeek: 0,
            thisWeek: 0
        }
    };

    // [ crash frequency ]
    // #TREND: avg session length * sessions / crashes, this week
    for (var dse = 0, dsel = state.data[1].data[processor.types[2].name].dailyTotals.length; dse < dsel; dse++) {
        // filter out the last week (week 3)
        if (dse > 6 && dse < 14) {
            // last week
            _totals.sessionLength.lastWeek.push(state.data[1].data[processor.types[6].name].dailyTotals[dse]),
            _totals.sessions.lastWeek      += state.data[1].data[processor.types[5].name].dailyTotals[dse],
            _totals.crashes.lastWeek       += state.data[1].data[processor.types[2].name].dailyTotals[dse];
        } else if (dse > 13) {
            // this week
            _totals.sessionLength.thisWeek.push(state.data[1].data[processor.types[6].name].dailyTotals[dse]),
            _totals.sessions.thisWeek      += state.data[1].data[processor.types[5].name].dailyTotals[dse],
            _totals.crashes.thisWeek       += state.data[1].data[processor.types[2].name].dailyTotals[dse];
        }   
    }

    // divide by session total, week
    state.processedData.categories.quality.lastWeek = (_totals.crashes.lastWeek === null || _totals.crashes.lastWeek === 0) ? null : (lib.number.getAvg(_totals.sessionLength.lastWeek) * _totals.sessions.lastWeek) / _totals.crashes.lastWeek,
    state.processedData.categories.quality.thisWeek = (_totals.crashes.thisWeek === null || _totals.crashes.thisWeek === 0) ? null :  (lib.number.getAvg(_totals.sessionLength.thisWeek) * _totals.sessions.thisWeek) / _totals.crashes.thisWeek;

    // #APPTS-3921
    state.processedData.categories.quality.metrics.crashFrequency.last7Days = state.processedData.categories.quality.thisWeek;

    processMonthAndQuarterData(state.data[2].data[processor.types[2].name], state.processedData.categories.quality, 'crashFrequency');
    processDaysData(state.data[1].data[processor.types[2].name], state.processedData.categories.quality, 'crashFrequency');
    processPlatformData(state.data[1].data[processor.types[2].name], state.processedData.categories.quality, 'crashFrequency');

    // determine direction for category metric
    if ((state.processedData.categories.quality.lastWeek === state.processedData.categories.quality.thisWeek) || (state.processedData.categories.quality.lastWeek === null || state.processedData.categories.quality.thisWeek === null)) {
        state.processedData.categories.quality.direction = 0;
    } else {
        state.processedData.categories.quality.direction = (state.processedData.categories.quality.lastWeek < state.processedData.categories.quality.thisWeek) ? 1 : -1;
    }
    
    // [ Sessions / Crashes ]
    processMonthAndQuarterData(state.data[2].data[processor.types[2].name], state.processedData.categories.quality, 'sessionsOverCrashes');
    processDaysData(state.data[1].data[processor.types[2].name], state.processedData.categories.quality, 'sessionsOverCrashes');
    processPlatformData(state.data[1].data[processor.types[2].name], state.processedData.categories.quality, 'sessionsOverCrashes');
}

// uniqueCrashes
function processUniqueCrashesData() {
    processMonthAndQuarterData(state.data[2].data[processor.types[3].name], state.processedData.categories.quality, 'uniqueCrashes');
    processDaysData(state.data[1].data[processor.types[3].name], state.processedData.categories.quality, 'uniqueCrashes');
    processPlatformData(state.data[1].data[processor.types[3].name], state.processedData.categories.quality, 'uniqueCrashes');
}

// installs
function processInstallsData() {
    // #TREND: (total installs, this week - total installs, last week) / total installs, last week
    // first process acquisition trend...

    for (var de = 0, del = state.data[1].data[processor.types[4].name].dailyTotals.length; de < del; de++) {
        // filter out the last week (week 3)
        if (de > 6 && de < 14) {
            // count daily install totals for last week
            state.processedData.categories.acquisition.lastWeek += state.data[1].data[processor.types[4].name].dailyTotals[de];
        } else if (de > 13) {
            // count daily install totals for this week
            state.processedData.categories.acquisition.thisWeek += state.data[1].data[processor.types[4].name].dailyTotals[de];
        }   
    }

    // determine direction for category metric
    if ((state.processedData.categories.acquisition.lastWeek === state.processedData.categories.acquisition.thisWeek) || (state.processedData.categories.acquisition.lastWeek === null || state.processedData.categories.acquisition.thisWeek === null)) {
        state.processedData.categories.acquisition.direction = 0;
    } else {
        state.processedData.categories.acquisition.direction = (state.processedData.categories.acquisition.lastWeek < state.processedData.categories.acquisition.thisWeek) ? 1 : -1;
    }

    // ...then process install data for quarter, week, current week by days
    processMonthAndQuarterData(state.data[2].data[processor.types[4].name], state.processedData.categories.acquisition, 'installs');
    processDaysData(state.data[1].data[processor.types[4].name], state.processedData.categories.acquisition, 'installs');
    processPlatformData(state.data[1].data[processor.types[4].name], state.processedData.categories.acquisition, 'installs');
}

// sessions
function processSessionsData() {
    processMonthAndQuarterData(state.data[2].data[processor.types[5].name], state.processedData.categories.engagement, 'sessions');
    processDaysData(state.data[1].data[processor.types[5].name], state.processedData.categories.engagement, 'sessions');
    processPlatformData(state.data[1].data[processor.types[5].name], state.processedData.categories.engagement, 'sessions');
}

// sessionLength
function processSessionLengthData() {
    var _totals = {
        sessionLength: {
            lastWeek: 0,
            thisWeek: 0
        },
        sessions: {
            lastWeek: 0,
            thisWeek: 0
        }
    };

    var _lastWeekArr = [],
        _thisWeekArr = [];

    // #TREND: (Avg Session Length, this week - avg sessions length, last week) / Avg Session Length, last week
    // we are assuming the dailyTotals length will be the same for both sessions and sessionLength
    for (var dse = 0, dsel = state.data[1].data[processor.types[6].name].dailyTotals.length; dse < dsel; dse++) {
        if (dse > 6 && dse < 14) {
            _lastWeekArr.push(state.data[1].data[processor.types[6].name].dailyTotals[dse] * 1000);
            _totals.sessions.lastWeek += state.data[1].data[processor.types[5].name].dailyTotals[dse];
        } else if (dse > 13) {
            _thisWeekArr.push(state.data[1].data[processor.types[6].name].dailyTotals[dse] * 1000);
            _totals.sessions.thisWeek += state.data[1].data[processor.types[5].name].dailyTotals[dse];
        }   
    }

    // we want the Avg Session Length average over 7 days of range
    state.processedData.categories.engagement.lastWeek = lib.number.getAvg(_lastWeekArr);
    state.processedData.categories.engagement.thisWeek = lib.number.getAvg(_thisWeekArr);

    // determine direction for category metric
    if ((state.processedData.categories.engagement.lastWeek === state.processedData.categories.engagement.thisWeek) || (state.processedData.categories.engagement.lastWeek === null || state.processedData.categories.engagement.thisWeek === null)) {
        state.processedData.categories.engagement.direction = 0;
    } else {
        state.processedData.categories.engagement.direction = (state.processedData.categories.engagement.lastWeek < state.processedData.categories.engagement.thisWeek) ? 1 : -1;
    }

    processMonthAndQuarterData(state.data[2].data[processor.types[6].name], state.processedData.categories.engagement, 'sessionLength');
    processDaysData(state.data[1].data[processor.types[6].name], state.processedData.categories.engagement, 'sessionLength');
    processPlatformData(state.data[1].data[processor.types[6].name], state.processedData.categories.engagement, 'sessionLength');
}

// reteionrate, uniqueDevices
function processUniqueData() {
    var _totals = {
        uniques: {
            beforeLastWeek: 0,
            lastWeek: 0,
            thisWeek: 0
        },
        installs: {
            lastWeek: 0,
            thisWeek: 0
        }
    };

    // retention rate: (sum daily unique current range - sum install current range) / last current range
    // e.g. (sum of unique devices, this week - sum of installs, this week) / sum of unique devices, last week
    for (var dse = 0, dsel = state.data[1].data[processor.types[7].name].dailyTotals.length; dse < dsel; dse++) {
        if (dse === 0 || dse < 7) {
            // 3rd week (before last)
            _totals.uniques.beforeLastWeek += state.data[1].data[processor.types[7].name].dailyTotals[dse];
        } else if (dse > 6 && dse < 14) {
            // 2nd week (last)
            _totals.uniques.lastWeek  += state.data[1].data[processor.types[7].name].dailyTotals[dse];
            _totals.installs.lastWeek += state.data[1].data[processor.types[4].name].dailyTotals[dse];
        } else if (dse > 13) {
            // 1st week (this)
            _totals.uniques.thisWeek  += state.data[1].data[processor.types[7].name].dailyTotals[dse];
            _totals.installs.thisWeek += state.data[1].data[processor.types[4].name].dailyTotals[dse];
        }   
    }

    state.processedData.categories.retention.lastWeek = (_totals.uniques.beforeLastWeek === 0) ? null : ((_totals.uniques.lastWeek - _totals.installs.lastWeek) / _totals.uniques.beforeLastWeek) * 100;
    state.processedData.categories.retention.thisWeek = (!_totals.uniques.lastWeek || _totals.uniques.lastWeek === 0) ? null : ((_totals.uniques.thisWeek - _totals.installs.thisWeek) / _totals.uniques.lastWeek) * 100; 
    
    // #APPTS-4032: don't allow to go below 0...
    state.processedData.categories.retention.lastWeek = (state.processedData.categories.retention.lastWeek < 0) ? 0 : state.processedData.categories.retention.lastWeek;
    state.processedData.categories.retention.thisWeek = (state.processedData.categories.retention.thisWeek < 0) ? 0 : state.processedData.categories.retention.thisWeek;

    // determine direction for category metric
    if ((state.processedData.categories.retention.lastWeek === state.processedData.categories.retention.thisWeek) || (state.processedData.categories.retention.lastWeek === null || state.processedData.categories.retention.thisWeek === null)) {
        state.processedData.categories.retention.direction = 0;
    } else {
        state.processedData.categories.retention.direction = (state.processedData.categories.retention.lastWeek < state.processedData.categories.retention.thisWeek) ? 1 : -1;
    }

    processMonthAndQuarterData(state.data[2].data[processor.types[7].name], state.processedData.categories.retention, 'retentionRate');
    processDaysData(state.data[1].data[processor.types[7].name], state.processedData.categories.retention, 'retentionRate');
    processPlatformData(state.data[1].data[processor.types[7].name], state.processedData.categories.retention, 'retentionRate'); 

    // Daily Uniques
    processMonthAndQuarterData(state.data[2].data[processor.types[7].name], state.processedData.categories.retention, 'uniqueDevices');
    processDaysData(state.data[1].data[processor.types[7].name], state.processedData.categories.retention, 'uniqueDevices');
    processPlatformData(state.data[1].data[processor.types[7].name], state.processedData.categories.retention, 'uniqueDevices'); 
}

function processFunnelData() {
    var _category      = null,
        _indexCounters = { acquisition:0, engagement:0, retention:0, quality:0 },
        _eventArr      = [],
        _funnelObj     = null;

    var _dataIndexes = {
        quarter: 3,
        month: 4,
        day: 5
    };

    for (var fi = 0, fil = state.data[_dataIndexes.day].data.length; fi < fil; fi ++) {
        _funnelObj = { events:[] };

        if (state.data[_dataIndexes.day].data[fi].shareWithInsights !== false) {
            _category = state.data[_dataIndexes.day].data[fi].shareWithInsights.toLowerCase();

            _funnelObj.name      = state.data[_dataIndexes.day].data[fi].name,
            _funnelObj.id        = state.data[_dataIndexes.day].data[fi]._id,
            _funnelObj.type      = 'funnel',
            _funnelObj.index     = _indexCounters[_category],
            _funnelObj.updated   = Date.parse(state.data[_dataIndexes.day].data[fi].updated),
            _funnelObj.last7Days = state.data[_dataIndexes.day].data[fi].completionRate;

            _funnelObj.range = [
                {
                    name: "Current Quarter",
                    total: state.data[_dataIndexes.quarter].data[fi].completionRate
                },
                {
                    name: 'Current Month',
                    total: state.data[_dataIndexes.month].data[fi].completionRate
                }
            ];

            for (var ei = 0, eil = state.data[_dataIndexes.day].data[fi].events.length; ei < eil; ei ++) {
                _funnelObj.events.push({
                    name: state.data[_dataIndexes.day].data[fi].events[ei].name,
                    count: state.data[_dataIndexes.day].data[fi].events[ei].count,
                    incoming: Math.round(state.data[_dataIndexes.day].data[fi].events[ei].percentage),
                    // 1 - (2500/3000), 1 - (tomorrowCount / todayCount)
                    dropOff: (!state.data[_dataIndexes.day].data[fi].events[ei].count) ? 0 : (ei + 1 === eil) ? '--' : Math.round((1 - (state.data[_dataIndexes.day].data[fi].events[ei + 1].count / state.data[_dataIndexes.day].data[fi].events[ei].count)) * 100)
                });
            }

            state.processedData.categories[_category].funnels.push(_funnelObj);

            _indexCounters[_category] ++;
        }

        _indexCounters[_category] ++;
    }
}

function processData(config) {
    var _config = config || {};

    Ti.API.info('Data to process...');
    Ti.API.info(_config.data);

    if (state.data.length === 0) {
        state.data              = _config.data;
        state.events.onComplete = _config.events.onComplete;

        prepareProcessedData();
    }

    if (state.processes.count !== processor.types.length) {
        processor.types[state.processes.count].method();
        
        state.processes.count ++;
        processData();
    } else {
        state.events.onComplete(state.processedData);

        reset();
    }
}

module.exports = function() {
    return {
        processData: processData
    };
};