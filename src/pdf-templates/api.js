let api = function(path, method, payload){
    const responseApi = fetch('http://127.0.0.1:8080' + path, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(function(response) {
        return response.json();
    }).then(function(res) {
        return res;
    });
    return responseApi;
}

export {
api
};