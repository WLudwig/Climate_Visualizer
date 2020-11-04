import json
import random
import sys
import shutil


def main(argv):

    
        

    print("\n****************\nJacob Blomquist - 2020\n*******************\n")
    print("Copying whitelisted files to HCNRaw\\\n\n")


    whiteListFile = open("whitelist.json","r")

    whiteList = json.load(whiteListFile)
    
    for i in whiteList:
        shutil.copy("USRaw/"+i+".dly","HCNRaw/")
        print("copied: USRaw/"+i+".dly"+" --> HCNRaw/")
        

    
    print("\n\nDONE!")


if __name__ == "__main__":
    main(sys.argv)
