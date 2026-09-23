function randomResolveReject() {
  const ms = Math.ceil(Math.random() * 1000);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (ms % 2 === 0) {
        resolve("promise resolved within time");
      } else {
        reject(new Error("promise rejected"));
      }
    }, ms);
  });
}

async function randomPromise() {
  try {
    const result = await randomResolveReject();
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

randomPromise();
