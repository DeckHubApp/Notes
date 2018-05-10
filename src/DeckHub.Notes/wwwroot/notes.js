(function(DeckHub, currentScript) {

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
        return DeckHub.DEV_PATH || window.location.pathname;
    }

    function notesUrl() {
        const path = pagePath().split('/').filter(s => !!s);
        const slideNumber = path.pop();
        const slug = path.pop();
        const presenter = path.pop();
        const place = path.pop();
        const show = DeckHub.show || `${place}/${presenter}/${slug}`;
        return `${urlPrefix}/${show}/${slideNumber}`;
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
        return fetch(notesUrl(), { method: 'PUT', credentials: 'same-origin', body: json, headers: headers })
            .then(checkStatus);
    }

    const notesFormComponent = {
        template: `
<div>
<form id="notes-form" v-on:submit="submit" class="h-100" v-if="userIsAuthenticated">
    <div class="card h-100">
        <div class="card-header text-center">Notes</div>
        <div class="card-body h-100">
            <textarea class="h-100 form-control p-1" v-model="text" id="note-text"></textarea>
        </div>
        <div class="card-footer text-center">
            <button type="submit" class="btn btn-outline-success mx-auto" :disabled="button.disabled">{{button.text}}</button>
        </div>
    </div>
</form>
<div v-else>
Please log in to take notes.
</div>
</div>`,
        created() {
            load()
                .then(notes => {
                    this.skipSave = true;
                    this.text = notes.text;
                    this.userIsAuthenticated = notes.userIsAuthenticated;
                });
        },
        data: () => ({
            userIsAuthenticated: false,
            text: '',
            button: {
                text: 'Save',
                disabled: false
            },
            saveTimeout: false,
            doNotSave: false
        }),
        watch: {
            text: function watchText(n, o) {
                if (this.skipSave) {
                    this.skipSave = false;
                    return;
                }
                if (n !== o) {
                    if (this.saveTimeout) {
                        clearTimeout(this.saveTimeout);
                    }
                    this.saveTimeout = setTimeout(this.save, 250);
                }
            }
        },
        methods: {
            save: function save() {
                if (this.doNotSave) return;
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
            },
            reset: function reset() {
                this.button.text = 'Save';
                this.button.disabled = false;
            },
            submit: function submit(event) {
                event.preventDefault();
                this.save();
            }
        }
    };

    const vm = new Vue({
        el: '#notes',
        components: {
            'notes-form': notesFormComponent
        },
        template: `<notes-form></notes-form>`
    });

})(window.DeckHub || (window.DeckHub = {}), document.currentScript);