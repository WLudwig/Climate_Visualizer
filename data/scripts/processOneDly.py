import json
import random
from collections import defaultdict
import sys


def main(argv):

    print("\n****************\nJacob Blomquist - 2020\n*******************\n")
    print("Process one DLY file into a CSV file with monthly summaries.\\\n\n")

    res = defaultdict(lambda : defaultdict(dict))

    # initialize return file
    dlyFile = open(argv[1], "r")

   

    for curLine in dlyFile:
        year = curLine[11:15]
        month = curLine[15:17]
        elType = curLine[17:21]
        if(elType != "PRCP" and
           elType != "SNOW" and 
           elType != "TMAX" and
           elType != "TMIN"):
            continue

        
        firstIdx = 21
        itemLen = 5
        sum = 0.0
        num = 0.0
        numOver100f = 0.0 #number of days over 100f (37.778 c)

        for i in range(31):
            curIdx = firstIdx + i*8
            curVal = float(curLine[curIdx:curIdx+itemLen])
            if(curVal!=-9999):
                sum+=curVal
                num+=1.0
            if(elType=="TMAX" and curVal >=377.78): #over 100 f
                numOver100f+=1
        if(num!=0):
            res[int(year)][int(month)][elType]=(sum/num)
            if(elType=="TMAX"):
                res[int(year)][int(month)]["O100"]=numOver100f

    
    path =argv[2]
    print("Saving to: ",path)
    output = open(path,'w')
    output.write(json.dumps(res))


    
    print("\n\nDONE!")


if __name__ == "__main__":
    main(sys.argv)
