const NodeHelper = require('node_helper');
const axios = require('axios');

module.exports = NodeHelper.create({
  start() {
    console.log(
      `${this.name} helper method started...`,
    ); /*eslint-disable-line*/
  },

  getArrivals(config) {
    const self = this;
    const url = 'https://bustime.mta.info/api/siri/stop-monitoring.json';
    const { apiKey } = config;
    const { stop } = config;
    const params = {
      key: apiKey,
      version: 2,
      OperatorRef: 'MTA',
      MonitoringRef: stop,
    };
    // const stops = config.stops.map((obj) => obj.stopId)

    axios.get(url, params).then(
      (response) => {
        const arrivalsData = self.buildArrivalsData(response.data);

        console.log('Sending arrivalsData: ', arrivalsData);
        self.sendSocketNotification('BUS_ARRIVALS', arrivalsData);
      },
      (error) => {
        console.error('API request was unsuccessful with error: ', error);
      },
    );
  },

  buildArrivalsData(data) {
    const arrivals = data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit;
    const arrivalDict = {};

    // Build dict of station: list of arrivals
    const currentTimestamp = new Date().getTime();
    for (let i = 0; i < arrivals.length; i += 1) {
      const lineName = arrivals[i].MonitoredVehicleJourney.PublishedLineName[0];
      const expectedTime = arrivals[i].MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime;
      const expectedTimestamp = new Date(expectedTime).getTime();

      // Convert to time delta from current time
      const minutesAway = Math.floor(
        (expectedTimestamp - currentTimestamp) / 1000 / 60,
      );
      let expectationText;
      if (minutesAway < 1) {
        expectationText = '<1 min';
      } else {
        expectationText = `${minutesAway} min`;
      }

      // Add to data store
      if (arrivalDict.hasOwnProperty(lineName)) {
        arrivalDict[lineName].push(expectationText);
      } else {
        arrivalDict[lineName] = [expectationText];
      }
    }

    return arrivalDict;
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived(notification, config) {
    console.log('socketNotificationReceived inside helper: %s', notification);
    if (notification === 'GET_BUS_ARRIVALS') {
      this.getArrivals(config);
    }
  },
});
