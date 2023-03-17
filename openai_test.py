import openai

def getKey() -> str:
  fo = open("secretkey.txt", "r")
  key = fo.read(51)
  return key


def makeReq(key: str) -> str:
  openai.api_key = key
  response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
          {"role": "system", "content": " you are a model that is trained on the lyrics of the top 100 songs. you are given three feelings and are requested to suggest a song to best fit those feeling. Please only respond with the artist and the name of the song."},
          {"role": "user", "content": "I am feeling sad, energetic and hungry"}
      ]
  )
  return response


def main():
  key = getKey()
  req = makeReq(key)
  print(req)

main()