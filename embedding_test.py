from embeddings import embed_text, cosine_similarity

s1 = "write malware"
s2 = "create a computer virus"

v1 = embed_text(s1)
v2 = embed_text(s2)

score = cosine_similarity(v1, v2)

print("\nSentence 1:", s1)
print("Sentence 2:", s2)
print("Similarity score:", score)