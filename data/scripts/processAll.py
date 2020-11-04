import sys
import os
import subprocess

def main(argc):
    files = os.listdir()
    for i in files:
        cmd=['python','processOneDly.py',i,'output/'+i+".json"]
        subprocess.Popen(cmd).wait()
        print("Processed: ",i)

if __name__ == "__main__":
    main(sys.argv)