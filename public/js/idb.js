let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {

    // Saves a reference to the database 
    const db = event.target.result;

    // Creates an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
  };

request.onsuccess = function(event) {

    // When db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // Checks if app is online, if yes run uploadFunds() function to send all local db data to api
    if (navigator.onLine) {
      uploadFunds();
    }
  };

  request.onerror = function(event) {

    // Log error
    console.log(event.target.errorCode);
  };

  function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const fundsObjectStore = transaction.objectStore('new_transaction');

    // Add record to your store with add method.
    fundsObjectStore.add(record);
  }

  function uploadFunds() {

    // Open a transaction to the db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // Access object store
    const fundsObjectStore = transaction.objectStore('new_transaction');

    // Get all records from store and set to a variable
    const getAll = fundsObjectStore.getAll();

    getAll.onsuccess = function() {

      // If there was data in indexedDb's store, send it to the api server
      if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(serverResponse => {
            if (serverResponse.message) {
              throw new Error(serverResponse);
            }

            const transaction = db.transaction(['new_transaction'], 'readwrite');
            const fundsObjectStore = transaction.objectStore('new_transaction');

            // Clears all items
            fundsObjectStore.clear();
          })
          .catch(err => {
            console.log(err);
          });
      }
    };
  }

  // Listener for when the app comes back online
  window.addEventListener('online', uploadFunds); 