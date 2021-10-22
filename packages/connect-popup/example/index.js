console.log('script');

let popup;
const onPopupBootstrap = () => {
    console.log('onPopupBootstrap');
};

const onPopupLoaded = () => {
    console.log('onPopupLoaded');
    setTimeout(() => {
        popup.postMessage({ type: 'ui-set_operation', payload: 'GetAddress' }, "*");

        popup.postMessage({ type: 'ui-request_confirmation', payload: 'GetAddress' }, "*");

    }, 2000);
};

const setHandler = () => {
    window.addEventListener(
        'message',
        message => {
            console.log('message', message);

            const { data } = message;

            switch (data.type) {
                case 'popup-bootstrap':
                    onPopupBootstrap();
                    break;
                case 'popup-loaded':
                    onPopupLoaded();
                    break;
                default:
                //
            }
        },
        false,
    );
};
const open = () => {
    const url = './popup.html';
    popup = window.open('', '_blank');
    if (popup) {
        popup.location.href = url; // otherwise android/chrome loose window.opener reference
    }
};

const run = () => {
    setHandler();
    open();
};

run();
