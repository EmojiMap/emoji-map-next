// takes an id from a review that looks like this:
// "places/ChIJifIePKtZwokRVZ-UdRGkZzs/reviews/ChdDSUhNMG9nS0VJQ0FnTUR3eGREQzV3RRAB"
// and returns the id:
// "ChdDSUhNMG9nS0VJQ0FnTUR3eGREQzV3RRAB"

export function getReviewId(id: string) {
  return id.split('/reviews/')[1];
}
