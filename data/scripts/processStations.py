import json
import random
import sys


def main(argv):

    path = "ghcnd-stations.txt"

    if(len(argv) == 2):
        path=argv[1]
        

    print("\n****************\nJacob Blomquist - 2020\n*******************\n")
    print("Processing Stations data to: stations.json\n\n")

    stations = open(path, "r")

    chars = ['*', '.', '~']

    badNames=[]
    goodNames=[]

    output = {}
    count = 0
    width = 50
    curWidth = 0
    for line in stations.readlines():
        # see readme for what these are
        country = line[0:2]
        if(country != "US"):
            # print(line)
            continue

        id = line[0:11]
        lat = line[12:20]
        lon = line[21:30]
        elev = line[31:37]
        state = line[38:40]
        name = line[41:71]
        gsn_flag = line[72:75]
        hcncrn_flag = line[76:79]
        if ("HCN" not in hcncrn_flag):
            badNames.append(id)
            continue;
        else:
            goodNames.append(id)
        wmo_id = line[80:85]
        item = {}
        item["id"] = id.strip()
        item["lat"] = lat.strip()
        item["lon"] = lon.strip()
        item["elev"] = elev.strip()
        item["state"] = state.strip()
        item["name"] = name.strip()
        item["gsn_flag"] = gsn_flag.strip()
        item["hcncrn_flag"] = hcncrn_flag.strip()
        item["wmo_id"] = wmo_id.strip()
        output[id] = item
        count += 1
        if count % 100 == 0:
            char = chars[random.randint(0, len(chars)-1)]
            print(char, end='', flush=True)
            curWidth += 1
            if curWidth > width:
                curWidth = 0
                print()

    stations.close()

    out = open("stations.json", "w")
    badOut = open("blacklist.json","w")
    goodOut = open("whitelist.json","w")

    out.write(json.dumps(output))
    badOut.write(json.dumps(badNames))
    goodOut.write(json.dumps(goodNames))

    out.close()
    badOut.close()
    goodOut.close()
    print("\n\nDONE!")


if __name__ == "__main__":
    main(sys.argv)
