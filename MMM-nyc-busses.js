// helloworld.js
Module.register('MMM-nyc-busses', {
  // Default module config.
  defaults: {
    header: 'Next Bus',
    module: 'MMM-nyc-transit',
    position: 'top_bar',
    stops: [
      {
        stopId: 237,
      },
      {
        stopId: 238,
      },
    ],
    updateInterval: 300000, // every 5 m
  },

  start() {
    this.getArrivals();
    this.scheduleUpdate();
  },

  getDom() {
    const wrapper = document.createElement('div');
    const data = this.result;
    let output = 'Loading...';
    if (data) {
      output = this.buildHTML(data);
    }

    wrapper.innerHTML = output;
    return wrapper;
  },

  buildHTML(arrivals_dict) {
    let out = '<ul>\n';
    for (const [lineName, lineArrivals] of Object.entries(arrivals_dict)) {
      out += `<li><b>${lineName}:</b> ${lineArrivals.join(', ')}</li>`;
    }
    out += '</ul>';
    return out;
  },

  getArrivals() {
    const { config } = this;

    console.log('Inside getArrivals main module');
    this.sendSocketNotification('GET_BUS_ARRIVALS', config);
  },

  scheduleUpdate() {
    const self = this;

    setInterval(() => {
      self.getDepartures();
    }, self.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    console.log(
      'socketNotificationReceived inside main module: %s',
      notification,
    );
    if (notification === 'BUS_ARRIVALS') {
      this.result = payload;
      // eslint-disable-next-line no-console
      console.log('socketNotificationReceived: "BUS_ARRIVALS": ', payload);
      this.updateDom();
    } else if (notification === 'DOM_OBJECTS_CREATED') {
      // eslint-disable-next-line no-console
      console.log('Dom Objects Created');
    }
  },
});
