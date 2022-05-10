# local-jsonbase

```bash
npm install local-jsonbase
```

```bash
yarn add local-jsonbase
```

## Example

```js
import JsonBase from "local-jsonbase"

const jsonBase = new JsonBase("database")
const docRef = await jsonBase.collection("users").add({
  username: "monty_bhai",
  age: 24,
})
docRef
  .collection("notifications")
  .doc("first")
  .create({ content: "This is your first notification." })
```

Highly inspired from `firestore`
