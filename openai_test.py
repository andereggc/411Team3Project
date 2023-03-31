import openai

def getKey() -> str:
  fo = open("secretkey.txt", "r")
  key = fo.read(51)
  return key


def makeReq(key: str, feelings: str) -> dict:
  openai.api_key = key
  response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
          {"role": "system", "content": " you are a model that is trained on the lyrics of the top 100 songs. you are given three feelings and are requested to suggest 10 songs that best fit a combination of those feelings. Please only respond with the artist and the name of the songs no other text."},
          {"role": "user", "content": "I am feeling " + feelings}
      ]
  )
  return response


def produceReq(feelings: list[str]) -> str:
  output = ""
  for feeling in feelings:
    if output != "":
      output += " and " + feeling
    else:
      output += feeling
  
  return output


def main():
 feelings = produceReq(["sad","depressed", "down"])
 key = getKey()
 resp = makeReq(key, feelings)
 print(resp.choices[0].message.content)

main()