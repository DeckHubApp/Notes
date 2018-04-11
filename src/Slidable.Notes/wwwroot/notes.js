(function(Slidable, currentScript) {

    function _urlPrefix(src) {
        var url = new URL(src, document.location.href);
        let parts = url.pathname.split('/').filter(s => !!s).slice(0, -1);
        if (parts.length === 0) {
            return '';
        }
        return `/${parts.join('/')}`;
    }

    const urlPrefix = _urlPrefix(currentScript.src);

    function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            var error = new Error(`${response.status} ${response.statusText}`);
            error.response = response;
            throw error;
        }
    }

    function pagePath() {
        return Slidable.DEV_PATH || window.location.pathname;
    }

    function notesUrl() {
        const path = pagePath().split('/').filter(s => !!s);
        const slideNumber = path.pop();
        const slug = path.pop();
        const presenter = path.pop();
        const place = path.pop();
        return `${urlPrefix}/${place}/${presenter}/${slug}/${slideNumber}`;
    }

    function load() {
        return fetch(notesUrl(), { method: 'GET', credentials: 'same-origin' })
            .then(checkStatus)
            .then(res => res.json());
    }

    function saveNotes(text) {
        const timestamp = new Date(Date.now()).toISOString();
        const json = JSON.stringify({ text: text, timestamp: timestamp });
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Content-Length', json.length.toString());
        return fetch(notesUrl(), { method: 'POST', credentials: 'same-origin', body: json, headers: headers })
            .then(checkStatus);
    }

    const notesFormComponent = {
        template: `
<form id="notes-form" v-on:submit="submit">
    <div class="form-group">
      <textarea id="notesText" v-model="text" class="form-control">
      <button class="btn btn-secondary" type="submit" :disabled="button.disabled">{{button.text}}</button>
    </div>
</form>`,
        created() {
            load()
                .then(notes => {
                    this.text = notes.text;
                });
        },
        data: () => ({
            text: '',
            button: {
                text: 'Save',
                disabled: false
            }
        }),
        methods: {
            reset: function reset() {
                this.button.text = 'Save';
                this.button.disabled = false;
            },
            submit: function submit(event) {
                event.preventDefault();
                this.button.text = 'Saving...';
                this.button.disabled = true;
                saveNotes(this.text)
                    .then(() => {
                        this.reset();
                    })
                    .catch(r => {
                        console.error(r);
                        this.reset();
                    });
            }
        }
    };

})(window.Slidable || {}, document.currentScript);