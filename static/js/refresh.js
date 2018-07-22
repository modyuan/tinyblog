let refresh = {
    timeid: 0,
    run: function () {
        window.fetch('/api/login', {credentials: "same-origin",method:"POST"})
            .then(res => {
                if (!res.ok) {
                    console.log('clear id:'+refresh.timeid);
                    window.clearInterval(refresh.timeid);
                }
            })
    },
    start: function () {
        this.timeid = window.setInterval(this.run, 1000 * 5);
    }
};

