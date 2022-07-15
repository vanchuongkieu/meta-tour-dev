class Utils {
  get isIOS() {
    return (
      [
        "iPad Simulator",
        "iPhone Simulator",
        "iPod Simulator",
        "iPad",
        "iPhone",
        "iPod",
      ].includes(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    );
  }

  get isMobile() {
    return (
      window.DeviceOrientationEvent &&
      location.protocol === "https:" &&
      navigator.userAgent.toLowerCase().indexOf("mobi") >= 0
    );
  }

  get isMobileOrIOS() {
    const isIOS = this.isIOS;
    const isMobile = this.isMobile == undefined ? false : this.isMobile;
    return isIOS || isMobile ? true : false;
  }
}

export default new Utils();
